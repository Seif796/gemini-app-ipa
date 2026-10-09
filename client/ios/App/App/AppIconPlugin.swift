import Foundation
import Capacitor
import UIKit

@objc(AppIconPlugin)
public class AppIconPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppIconPlugin"
    public let jsName = "AppIconPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setAlternateIconName", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getAlternateIconName", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "supportsAlternateIcons", returnType: CAPPluginReturnPromise)
    ]

    @objc func supportsAlternateIcons(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let supports = UIApplication.shared.supportsAlternateIcons
            call.resolve(["supports": supports])
        }
    }

    @objc func getAlternateIconName(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let current = UIApplication.shared.alternateIconName
            call.resolve(["iconName": current ?? "primary"])
        }
    }

    @objc func setAlternateIconName(_ call: CAPPluginCall) {
        guard let name = call.getString("name") else {
            // Nil resets to primary icon
            DispatchQueue.main.async {
                UIApplication.shared.setAlternateIconName(nil) { error in
                    if let err = error {
                        call.reject("Failed to reset icon: \(err.localizedDescription)")
                    } else {
                        call.resolve(["success": true, "iconName": "primary"])
                    }
                }
            }
            return
        }

        let iconToSet: String? = (name == "primary" || name.isEmpty) ? nil : name

        DispatchQueue.main.async {
            if !UIApplication.shared.supportsAlternateIcons {
                call.reject("Device does not support alternate icons")
                return
            }

            UIApplication.shared.setAlternateIconName(iconToSet) { error in
                if let err = error {
                    call.reject("Failed to set alternate icon: \(err.localizedDescription)")
                } else {
                    call.resolve(["success": true, "iconName": name])
                }
            }
        }
    }
}

