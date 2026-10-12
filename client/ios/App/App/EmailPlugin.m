#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Bridges the Swift EmailPlugin methods to Capacitor JavaScript bridge
CAP_PLUGIN(EmailPlugin, "EmailPlugin",
    CAP_PLUGIN_METHOD(verifyCredentials, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(fetchInboxStatus, CAPPluginReturnPromise);
)

