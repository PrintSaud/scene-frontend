import UIKit

@objc(RCTUITextField)
class RCTUITextField: UITextField {
    override var defaultTextAttributes: [NSAttributedString.Key : Any] {
        get {
            if #available(iOS 26.0, *) {
                return [:] // prevent crash on iOS 26
            } else {
                return super.defaultTextAttributes
            }
        }
        set {
            if #available(iOS 26.0, *) {
                // ignore in iOS 26+
            } else {
                super.defaultTextAttributes = newValue
            }
        }
    }
}

