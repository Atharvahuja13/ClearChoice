import SwiftUI

@main
struct ClearChoiceApp: App {
    @StateObject private var model = ChoiceModel()
    var body: some Scene { WindowGroup { ContentView().environmentObject(model).preferredColorScheme(.dark) } }
}

@MainActor final class ChoiceModel: ObservableObject {
    @Published var mode = UserDefaults.standard.string(forKey: "mode") ?? "UI Overlay"
    @Published var paused = UserDefaults.standard.bool(forKey: "paused")
    @Published var apps = ["ClearChoice Demo": true, "Shopee": false, "Lazada": false, "TikTok Shop": false, "Amazon": false]
    @Published var preset = "Balanced"
    @Published var activity = ["Ready · local device", "Demo store available"]
    @Published var privacy = "Sensitive fields stay in the original page."
    func setMode(_ value: String) { mode = value; UserDefaults.standard.set(value, forKey: "mode") }
    func togglePause() { paused.toggle(); UserDefaults.standard.set(paused, forKey: "paused"); activity.insert(paused ? "Engine paused" : "Engine resumed", at: 0) }
    func launchDemo() { activity.insert("Demo store can be opened in Safari", at: 0) }
}

struct ContentView: View {
    @EnvironmentObject private var model: ChoiceModel
    @State private var tab = 0
    @State private var showDemo = false
    private let purple = Color(red: 0.72, green: 0.43, blue: 0.96)
    var body: some View {
        ZStack {
            LinearGradient(colors: [Color(red: 0.10, green: 0.08, blue: 0.14), .black], startPoint: .topLeading, endPoint: .bottomTrailing).ignoresSafeArea()
            TabView(selection: $tab) {
                home.tabItem { Label("Home", systemImage: "house.fill") }.tag(0)
                apps.tabItem { Label("Features", systemImage: "square.grid.2x2.fill") }.tag(1)
                activity.tabItem { Label("Activity", systemImage: "chart.bar.xaxis") }.tag(2)
                settings.tabItem { Label("Settings", systemImage: "gearshape.fill") }.tag(3)
            }.tint(purple)
        }
    }
    private var home: some View { ScrollView { VStack(alignment: .leading, spacing: 18) {
        HStack { Image(systemName: "checkmark.seal.fill").font(.system(size: 32)).foregroundStyle(purple); Text("ClearChoice").font(.title2.bold()); Spacer(); Image(systemName: "bell") }.padding(.top, 8)
        VStack(alignment: .leading, spacing: 12) { Text("SHOPPING, MADE CLEARER").font(.caption2.bold()).tracking(2).foregroundStyle(purple); Text("Enhance your **shopping** apps.").font(.system(size: 29, weight: .bold, design: .rounded)); Text("A smarter, calmer experience — on your apps, on your terms.").foregroundStyle(.white.opacity(0.72)); Button { model.launchDemo(); showDemo = true } label: { Label("Launch Shopping Mode", systemImage: "play.fill").frame(maxWidth: .infinity).padding(14) }.buttonStyle(GlowButton()) }.padding(20).background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 24)).overlay(RoundedRectangle(cornerRadius: 24).stroke(.white.opacity(0.13)))
        HStack { Text("Connected apps").font(.headline); Spacer(); Button("Manage ›") { tab = 1 }.foregroundStyle(purple) }
        HStack(spacing: 9) { ForEach([("Shopee", "bag.fill"), ("Lazada", "shippingbox.fill"), ("TikTok", "music.note"), ("Amazon", "a.circle.fill")], id: \.0) { app in VStack(spacing: 7) { Image(systemName: app.1).font(.title2).frame(height: 28).foregroundStyle(purple); Text(app.0).font(.caption2); Text("Unverified").font(.system(size: 8)).foregroundStyle(.secondary) }.frame(maxWidth: .infinity).padding(.vertical, 12).background(.white.opacity(0.05), in: RoundedRectangle(cornerRadius: 15)) } }
        VStack(alignment: .leading, spacing: 8) { HStack { Text("Active session").font(.headline); Spacer(); Text(model.paused ? "PAUSED" : "READY").font(.caption2.bold()).foregroundStyle(.green) }; HStack { Image(systemName: "checkmark.seal.fill").foregroundStyle(purple).font(.title2); VStack(alignment: .leading) { Text("ClearChoice Demo").bold(); Text("\(model.mode) · demo integration").font(.caption).foregroundStyle(.secondary) }; Spacer(); Button(model.paused ? "Resume" : "Pause") { model.togglePause() }.buttonStyle(.bordered) } }.padding(16).background(.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 18))
        Text("Retailer connections require a verified integration. ClearChoice Demo is the supported environment here.").font(.caption).foregroundStyle(.secondary)
    }.padding(18) }.sheet(isPresented: $showDemo) { DemoShopView() } }
    private var apps: some View { List { Section("Shopping mode") { ForEach(["UI Overlay", "Smart Shopping", "Data Assist", "AI Buying Assistant"], id: \.self) { m in Button { model.setMode(m) } label: { HStack { Image(systemName: m == model.mode ? "largecircle.fill.circle" : "circle").foregroundStyle(purple); VStack(alignment: .leading) { Text(m).foregroundStyle(.primary); Text(describe(m)).font(.caption).foregroundStyle(.secondary) }; Spacer() } } } }; Section("App preferences") { ForEach(Array(model.apps.keys.sorted()), id: \.self) { name in HStack { Toggle(name, isOn: Binding(get: { model.apps[name] ?? false }, set: { model.apps[name] = $0 })); Text(name == "ClearChoice Demo" ? "Supported" : "Preference only · unverified").font(.caption2).foregroundStyle(name == "ClearChoice Demo" ? .green : .secondary) }.padding(.vertical, 3) } }; Section("Experience Studio") { NavigationLink("Open Experience Studio") { StudioView(preset: $model.preset) }; Text("Safari access remains controlled per website in iOS Settings.").font(.caption).foregroundStyle(.secondary) } }.scrollContentBackground(.hidden).navigationTitle("Features") }
    private var activity: some View { NavigationStack { List { Section("On this device") { ForEach(model.activity, id: \.self) { Text($0).font(.subheadline) } }; Section("Privacy") { Text(model.privacy).font(.caption).foregroundStyle(.secondary) } }.scrollContentBackground(.hidden).navigationTitle("Activity") } }
    private var settings: some View { NavigationStack { Form { Section("Safari") { Text("Safari web extension"); Text("Enable ClearChoice in Settings → Apps → Safari → Extensions. iOS controls access per website.").font(.caption).foregroundStyle(.secondary) }; Section("Privacy") { Label("No account required", systemImage: "person.crop.circle"); Label("Sensitive fields excluded", systemImage: "hand.raised"); Text("Preferences are stored on this device. The extension does not grant or claim access to other apps.").font(.caption).foregroundStyle(.secondary) }; Section("Controls") { Toggle("Pause ClearChoice", isOn: Binding(get: { model.paused }, set: { _ in model.togglePause() })); Button("Reset local preferences", role: .destructive) { model.setMode("UI Overlay"); model.preset = "Balanced" } } }.scrollContentBackground(.hidden).navigationTitle("Settings") } }
    private func describe(_ mode: String) -> String { ["UI Overlay":"A presentation layer for supported Safari pages.", "Smart Shopping":"Fixture savings in the demo store.", "Data Assist":"Clearly labeled sample data.", "AI Buying Assistant":"Requires a configured secure gateway."][mode] ?? "" }
}

struct GlowButton: ButtonStyle { func makeBody(configuration: Configuration) -> some View { configuration.label.font(.headline).foregroundStyle(.white).background(LinearGradient(colors: [Color.purple, Color.pink.opacity(0.8)], startPoint: .leading, endPoint: .trailing), in: RoundedRectangle(cornerRadius: 15)).shadow(color: .purple.opacity(configuration.isPressed ? 0.15 : 0.4), radius: 14) } }


struct StudioView: View {
    @Binding var preset: String
    @State private var simplification = 55.0
    @State private var accessibility = 60.0
    @State private var spacing = 50.0
    @State private var font = 50.0
    @State private var density = 45.0
    @State private var contrast = 55.0
    @State private var shape = 50.0
    @State private var ctaLimit = 2.0
    @State private var scope = "Global"
    @State private var prompt = ""
    @State private var saved = false
    var body: some View { Form {
        Section("Presets") { Picker("Preset", selection: $preset) { ForEach(["Balanced", "Minimal", "Accessible", "Custom"], id: \.self, content: Text.init) }.pickerStyle(.segmented) }
        Section("Scope") { Picker("Apply to", selection: $scope) { ForEach(["Global", "ClearChoice Demo", "Product page", "Cart"], id: \.self, content: Text.init) } }
        Section("Adjustments") { slider("Simplification", $simplification); slider("Accessibility", $accessibility); slider("Spacing", $spacing); slider("Font size", $font); slider("Content density", $density); slider("Color contrast", $contrast); slider("Corner shape", $shape); slider("Primary actions", $ctaLimit, range: 1...4) }
        Section("Describe a change") { TextField("e.g. Larger text and more spacing", text: $prompt); Button("Apply prompt") { parse() } }
        Section("Preview · \(scope)") { VStack(alignment: .leading, spacing: spacing / 10) { Text("CLEARCHOICE DEMO · PRODUCT").font(.caption).tracking(1); Text("Noise-cancelling headphones").font(.system(size: 17 + font / 13, weight: .bold)); Text("Clear product details and a simple path forward.").font(.system(size: 12 + accessibility / 16)); Text("$129.00").bold(); Button("Add to cart") {}.buttonStyle(.borderedProminent).tint(.purple) }.padding(12).frame(maxWidth: .infinity, alignment: .leading).background(contrast > 75 ? Color.white : Color.purple.opacity(0.12), in: RoundedRectangle(cornerRadius: 10 + shape / 5)).foregroundStyle(contrast > 75 ? .black : .primary).lineSpacing(density > 70 ? 5 : 1) }
        Section { Button(saved ? "Profile saved on this device ✓" : "Save profile") { saved = true } }
    }.scrollContentBackground(.hidden).navigationTitle("Experience Studio") }
    private func slider(_ name: String, _ value: Binding<Double>, range: ClosedRange<Double> = 0...100) -> some View { VStack(alignment: .leading) { HStack { Text(name); Spacer(); Text(range == 1...4 ? "\(Int(value.wrappedValue))" : "\(Int(value.wrappedValue))%").foregroundStyle(.secondary) }; Slider(value: value, in: range).tint(.purple) } }
    private func parse() { let q = prompt.lowercased(); if q.contains("large") { font = 85 }; if q.contains("access") || q.contains("contrast") { accessibility = 90; contrast = 90 }; if q.contains("less") || q.contains("clutter") { density = 20 }; if q.contains("spacing") { spacing = 80 }; preset = "Custom" }
}

private struct DemoProduct: Identifiable { let id: Int; let name: String; let emoji: String; let price: Int; let deal: Int; let variants: [String] }
struct DemoShopView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var cart: [Int:Int] = [:]
    @State private var query = ""
    @State private var selected: DemoProduct?
    private let products = [DemoProduct(id: 1,name:"QuietComfort Headphones",emoji:"🎧",price:329,deal:279,variants:["Midnight Black","Silver"]), DemoProduct(id: 2,name:"Studio One Headphones",emoji:"🎧",price:159,deal:129,variants:["Cloud White","Graphite"]), DemoProduct(id: 3,name:"Ceramic Everyday Mug",emoji:"☕",price:32,deal:24,variants:["Sandstone","Ocean"]), DemoProduct(id: 4,name:"Daily Carry Backpack",emoji:"🎒",price:98,deal:76,variants:["Forest","Charcoal"]), DemoProduct(id: 5,name:"Linen Relaxed Shirt",emoji:"👕",price:68,deal:54,variants:["S","M","L"]), DemoProduct(id: 6,name:"Rechargeable Desk Lamp",emoji:"💡",price:74,deal:58,variants:["Brass","Black"]), DemoProduct(id: 7,name:"Smart Indoor Garden",emoji:"🪴",price:179,deal:149,variants:["Sage","White"]), DemoProduct(id: 8,name:"Portable Speaker",emoji:"🔊",price:89,deal:69,variants:["Blue","Black"]), DemoProduct(id: 9,name:"Foldable Keyboard",emoji:"⌨️",price:64,deal:49,variants:["Graphite","White"]), DemoProduct(id: 10,name:"Espresso Maker",emoji:"☕",price:149,deal:119,variants:["Black","Cream"]), DemoProduct(id: 11,name:"Soft Knit Sweater",emoji:"🧶",price:110,deal:88,variants:["Rose","Blue"]), DemoProduct(id: 12,name:"Lightweight Weekender",emoji:"🧳",price:120,deal:95,variants:["Stone","Navy"]) ]
    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(products.filter { query.isEmpty || $0.name.localizedCaseInsensitiveContains(query) }) { item in
                        HStack(spacing: 12) {
                            Text(item.emoji).font(.largeTitle).frame(width: 58, height: 58).background(.white.opacity(0.07), in: RoundedRectangle(cornerRadius: 14))
                            VStack(alignment: .leading) {
                                Text(item.name).font(.headline)
                                Text("Demo fixture · sample history $\(item.price) → $\(item.deal)").font(.caption).foregroundStyle(.secondary)
                                Text("$\(item.deal).00").foregroundStyle(.green).bold()
                            }
                            Spacer()
                            Button("View") { selected = item }.buttonStyle(.bordered)
                            Button("Add") { cart[item.id, default: 0] += 1 }.buttonStyle(.borderedProminent).tint(.purple)
                        }.padding(12).background(.white.opacity(0.05), in: RoundedRectangle(cornerRadius: 17))
                    }
                }.padding()
            }
            .searchable(text: $query)
            .toolbar {
                ToolbarItem(placement: .principal) { Text("ClearChoice Demo").bold() }
                ToolbarItem(placement: .topBarTrailing) { Text("Cart \(cart.values.reduce(0, +))") }
                ToolbarItem(placement: .topBarTrailing) { Button("Done") { dismiss() } }
            }
            .sheet(item: $selected) { p in
                NavigationStack {
                    VStack(alignment: .leading, spacing: 14) {
                        Text(p.emoji).font(.system(size: 64))
                        Text(p.name).font(.title.bold())
                        Text("Illustrative demo history · $\(p.price) → $\(p.deal)")
                        Picker("Variant", selection: .constant(p.variants[0])) { ForEach(p.variants, id: \.self, content: Text.init) }
                        Button("Add to cart · $\(p.deal)") { cart[p.id, default: 0] += 1 }.buttonStyle(.borderedProminent).tint(.purple)
                        Spacer()
                    }.padding().navigationTitle("Product").navigationBarTitleDisplayMode(.inline)
                }
            }
        }
    }
}
