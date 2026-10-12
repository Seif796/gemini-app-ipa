import Foundation
import Capacitor
import Network

@objc(EmailPlugin)
public class EmailPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "EmailPlugin"
    public let jsName = "EmailPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "verifyCredentials", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "fetchInboxStatus", returnType: CAPPluginReturnPromise)
    ]

    private func resolveHost(provider: String, customHost: String?) -> String {
        if let h = customHost, !h.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return h.trimmingCharacters(in: .whitespacesAndNewlines)
        }
        let p = provider.lowercased()
        if p.contains("gmail") { return "imap.gmail.com" }
        if p.contains("outlook") || p.contains("hotmail") || p.contains("office365") { return "outlook.office365.com" }
        if p.contains("icloud") || p.contains("apple") || p.contains("me.com") { return "imap.mail.me.com" }
        if p.contains("yahoo") { return "imap.mail.yahoo.com" }
        return "imap.gmail.com"
    }

    @objc func verifyCredentials(_ call: CAPPluginCall) {
        guard let email = call.getString("email"), !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            call.reject("يرجى إدخال البريد الإلكتروني")
            return
        }
        guard let password = call.getString("password"), !password.isEmpty else {
            call.reject("يرجى إدخال كلمة المرور للتحقق من الحساب")
            return
        }

        let cleanEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        let provider = call.getString("provider") ?? "gmail"
        let host = resolveHost(provider: provider, customHost: call.getString("host"))
        let portRaw = call.getInt("port") ?? 993
        let port = NWEndpoint.Port(rawValue: UInt16(portRaw)) ?? .imaps

        let endpointHost = NWEndpoint.Host(host)
        let tlsOptions = NWProtocolTLS.Options()
        let params = NWParameters(tls: tlsOptions)
        let connection = NWConnection(host: endpointHost, port: port, using: params)

        var hasFinished = false
        func finish(success: Bool, message: String, unreadCount: Int = 0, totalCount: Int = 0) {
            guard !hasFinished else { return }
            hasFinished = true
            connection.cancel()

            DispatchQueue.main.async {
                if success {
                    call.resolve([
                        "success": true,
                        "verified": true,
                        "email": cleanEmail,
                        "host": host,
                        "port": portRaw,
                        "provider": provider,
                        "unreadCount": unreadCount,
                        "totalCount": totalCount,
                        "message": message
                    ])
                } else {
                    call.reject(message)
                }
            }
        }

        // 14 seconds timeout
        DispatchQueue.global().asyncAfter(deadline: .now() + 14) {
            finish(success: false, message: "انتهت مهلة الاتصال بخادم البريد (\(host)). تأكد من اتصال الإنترنت.")
        }

        connection.stateUpdateHandler = { state in
            switch state {
            case .ready:
                // Connection established, wait for IMAP * OK greeting
                self.receiveChunk(connection: connection) { greeting in
                    guard greeting.contains("* OK") else {
                        finish(success: false, message: "تعذر بدء الاتصال مع خادم البريد (\(host))")
                        return
                    }

                    // Send LOGIN command with credentials
                    let safePass = password.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "\"", with: "\\\"")
                    let loginCmd = "A001 LOGIN \"\(cleanEmail)\" \"\(safePass)\"\r\n"

                    self.sendCmd(connection: connection, text: loginCmd) {
                        self.receiveChunk(connection: connection) { loginResp in
                            if loginResp.contains("A001 OK") {
                                // LOGIN ACCEPTED! Credentials are correct.
                                // Now get Inbox unread count
                                self.sendCmd(connection: connection, text: "A002 STATUS INBOX (UNSEEN MESSAGES)\r\n") {
                                    self.receiveChunk(connection: connection) { statusResp in
                                        var unread = 0
                                        var total = 0
                                        if let uRange = statusResp.range(of: "UNSEEN ") {
                                            let sub = statusResp[uRange.upperBound...]
                                            let digits = sub.prefix(while: { $0.isNumber })
                                            unread = Int(digits) ?? 0
                                        }
                                        if let mRange = statusResp.range(of: "MESSAGES ") {
                                            let sub = statusResp[mRange.upperBound...]
                                            let digits = sub.prefix(while: { $0.isNumber })
                                            total = Int(digits) ?? 0
                                        }

                                        _ = self.sendCmd(connection: connection, text: "A003 LOGOUT\r\n") {}
                                        finish(success: true, message: "تم التحقق بنجاح من صحة البريد وكلمة المرور! تم الاتصال بالحساب.", unreadCount: unread, totalCount: total)
                                    }
                                }
                            } else if loginResp.contains("AUTHENTICATIONFAILED") || loginResp.contains("A001 NO") || loginResp.contains("A001 BAD") {
                                let isGoogle = host.contains("gmail") || cleanEmail.contains("gmail.com")
                                var msg = "كلمة المرور غير صحيحة! تم رفض تسجيل الدخول من خادم البريد (\(host))."
                                if isGoogle {
                                    msg += " (يرجى التأكد من استخدام كلمة مرور التطبيقات App Password المكونة من 16 حرفاً لحساب Google لحماية حسابك)"
                                }
                                finish(success: false, message: msg)
                            } else {
                                finish(success: false, message: "فشل التحقق من البريد: \(loginResp.trimmingCharacters(in: .whitespacesAndNewlines))")
                            }
                        }
                    }
                }
            case .failed(let err):
                finish(success: false, message: "فشل الاتصال بخادم البريد: \(err.localizedDescription)")
            case .cancelled:
                break
            default:
                break
            }
        }

        connection.start(queue: .global())
    }

    @objc func fetchInboxStatus(_ call: CAPPluginCall) {
        verifyCredentials(call)
    }

    private func sendCmd(connection: NWConnection, text: String, completion: @escaping () -> Void) {
        guard let data = text.data(using: .utf8) else {
            completion()
            return
        }
        connection.send(content: data, completion: .contentProcessed({ _ in
            completion()
        }))
    }

    private func receiveChunk(connection: NWConnection, completion: @escaping (String) -> Void) {
        connection.receive(minimumIncompleteLength: 1, maximumLength: 4096) { data, _, _, _ in
            if let d = data, let str = String(data: d, encoding: .utf8) {
                completion(str)
            } else {
                completion("")
            }
        }
    }
}

