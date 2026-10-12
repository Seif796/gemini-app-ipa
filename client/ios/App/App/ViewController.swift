import UIKit
import Capacitor

class ViewController: CAPBridgeViewController {

    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        
        // Explicitly register local plugins into Capacitor bridge
        bridge?.registerPluginInstance(EmailPlugin())
        bridge?.registerPluginInstance(AppIconPlugin())
    }
}

