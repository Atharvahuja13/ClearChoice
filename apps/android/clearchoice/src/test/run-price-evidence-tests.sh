#!/bin/sh
set -eu
cc_test_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cc_javac=${JAVA_HOME:+$JAVA_HOME/bin/}javac
cc_java=${JAVA_HOME:+$JAVA_HOME/bin/}java
cc_price_classes=$(mktemp -d)
trap 'rm -rf "$cc_price_classes"' EXIT
"$cc_javac" -d "$cc_price_classes" "$cc_test_dir/../main/java/com/clearchoice/PriceEvidenceParser.java" "$cc_test_dir/java/com/clearchoice/PriceEvidenceParserTest.java"
"$cc_java" -cp "$cc_price_classes" com.clearchoice.PriceEvidenceParserTest
