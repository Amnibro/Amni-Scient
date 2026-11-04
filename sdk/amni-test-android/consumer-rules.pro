# Amni-Test SDK: keep the public entry points so apps that minify their
# closed-test build can still call them by name (e.g. from Java or reflection).
-keep class com.amniscient.amnitest.AmniTest { public *; }
-keep class com.amniscient.amnitest.AmniTestException { *; }
