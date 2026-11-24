# ── Capacitor bridge ──────────────────────────────────────────────────────────
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep class * extends com.getcapacitor.Plugin { *; }

# JavaScript interface methods called from WebView
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ── Firebase ──────────────────────────────────────────────────────────────────
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# ── Stack traces lisibles ─────────────────────────────────────────────────────
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ── Kotlin metadata (nécessaire pour la réflexion Kotlin) ─────────────────────
-keepattributes *Annotation*
-keepattributes RuntimeVisibleAnnotations
-keep class kotlin.Metadata { *; }

# ── Sérialisation JSON (Gson / Moshi si utilisé par des plugins) ──────────────
-keepclassmembers,allowobfuscation class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# ── AndroidX / Jetpack ────────────────────────────────────────────────────────
-keep class androidx.** { *; }
-dontwarn androidx.**

# ── Facebook (Capacitor Firebase Authentication optional dependency) ──────────
-dontwarn com.facebook.**

