import UIKit
import Capacitor

/// Cycle de vie UIScene, obligatoire pour les apps compilées avec le SDK iOS 27+
/// (sans lui, iOS ferme l'app au lancement).
/// La fenêtre est créée à partir du storyboard « Main » déclaré dans Info.plist
/// (UIApplicationSceneManifest). Les liens entrants (dyspo://, liens universels),
/// qui arrivent désormais ici et non plus dans l'AppDelegate, sont transmis à
/// Capacitor pour que l'événement `appUrlOpen` continue de fonctionner.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard scene is UIWindowScene else { return }

        // App lancée depuis un lien alors qu'elle était fermée
        if let url = connectionOptions.urlContexts.first?.url {
            openURL(url)
        }
        if let userActivity = connectionOptions.userActivities.first {
            continueUserActivity(userActivity)
        }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        for context in URLContexts {
            openURL(context.url)
        }
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        continueUserActivity(userActivity)
    }

    private func openURL(_ url: URL) {
        _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: url, options: [:])
    }

    private func continueUserActivity(_ userActivity: NSUserActivity) {
        _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
    }
}
