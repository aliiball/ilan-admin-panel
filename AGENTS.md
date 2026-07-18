# İlan Admin Panel — AI ajanları için kurallar

Bu repo gayrimenkul ilan platformunun **admin panelini** içerir. Public Front Pages
ayrı bir repository'dedir ve **component paylaşımı yoktur**.

## Şartname

Kaynak şartname: **`gayrimenkul-admin-panel-uygulama-brifingi.md`** (repo kökünde).

Faz 3'ün 11 ekran tanımı, dashboard fixture'ının kesin sayıları ve
`users.ts`/`reports.ts` fixture gereksinimleri **yalnızca orada** — sırası gelince oku.

Ama **körlemesine uygulama.** Aşağıda brifingin doğrulanmış hatalarını ve
kullanıcının onayladığı sapmaları listeledim; çelişki olursa **bu dosya üstündür.**
Brifing bu düzeltmelerden haberdar değil — kendi zorunlu kıldığı
`exactOptionalPropertyTypes` ile kendi kodu bile derlenmiyordu.

Dosyaya **dokunma ve biçimlendirme** — dış kaynaklı bir referans, `.prettierignore`'da
tutuluyor. (Bir kez Prettier'a yakalandı ve tabloları yeniden hizalandı.)

## Değişmez kurallar

- Front Pages component'i **import etme veya kopyalama**.
- Her yeni component için **story yaz**. En az: Default, Loading, Disabled, Long content.
  Veri gösteriyorsa ayrıca Empty ve Error.
- **Prop'lara JSDoc zorunlu.** Bu açıklamalar Storybook Controls paneline ve AI
  manifest'ine (`manifests/components.json`) doğrudan akar. Yazılmazsa o kanal boş kalır.
- Component'ler **ham renk/ölçü içermez**, yalnızca `vars` (bkz. `src/tokens/contract.css.ts`).
- Component'ler **veri çekmez**. Veri prop'tan gelir. Fetch, sayfa katmanının işidir.
- Storybook'a **gerçek API anahtarı, production verisi veya gerçek kullanıcı bilgisi
  girmez.** Telefonlar `555`, e-postalar `.invalid`.
- **İş kuralları `src/domain/` altında.** Etiketler `domain/labels.ts`'te — component
  içine gömme; aynı durum listede, kuyrukta ve detayda görünür.
- Formatlama yardımcıları `src/utils/`'te. Component içine kopyalama.
- Yetki kontrolü component'in işi değil: kullanıcının yetkisi yoksa butonu
  `disabled` verme, **hiç render etme**.

## Bu repoya özgü tuzaklar — hepsi yaşandı, hepsi ölçüldü

**`@/` alias'ını prop tipi import'unda kullanma.** Storybook'un react-docgen'i onu
çözemiyor ve çözemeyince **component'in tamamını atlıyor** — prop tablosu ve AI
manifest'i sessizce boş kalıyor. Prop tipleri için göreli yol kullan:
`import type { ButtonProps } from '../../../types/component-props'`. Kodun geri
kalanında `@/` serbest.

**Base UI handler'larını sarmala.** Base UI `onCheckedChange`/`onValueChange`/
`onOpenChange`'e **ikinci bir `eventDetails` argümanı** geçiyor; brifingin sözleşmesi
tek argümanlı. Doğrudan geçirilirse `onCheckedChange={setState}` yazan biri
`setState(true, {...})` çağırmış olur. Her zaman `(next) => handler(next)` diye sarmala.

**`data-invalid` / `data-disabled`'ı elle ver.** Base UI bunları `Field.Root`'a
koyuyor; senin kutun onun içindeki sıradan bir `span` ise **devralmaz** ve hatalı
kutu kırmızı kenarlık almaz.

**Field.Control olmayan kontrolde etiket kopar.** `Field.Label`'ın `for`'u yalnızca
Field'a kayıtlı control'e bağlanır. Çıplak `<textarea>` veya `Popover.Trigger`
kullanıyorsan ya `Field.Control` ile sar ya da `FieldShell`'in `labelId` prop'uyla
`aria-labelledby` bağını ters yönden kur.

**Yeni Base UI alt yolu eklersen `optimizeDeps`'e de ekle** (`vite.config.ts`).
Eklemezsen sıcak cache'te ilk test çalıştırması "Failed to fetch dynamically imported
module" ile patlar. CI etkilenmez (orada cache soğuktur), ama geliştirici deli olur.

**Testler her şeyi yakalamaz.** Bu oturumda testler geçerken şunlar bozuktu:
Input'un hata stilleri (test `closest()` ile **atayı** bulup "geçti" demişti),
tablodaki her satırda görünen "Satırı seç" metni, Checkbox'ın fazladan argüman
sızdırması. **Ekran görüntüsü al ve DOM'u ölç** — özellikle stil ve erişilebilirlik
iddialarında.

**Storybook'un `Meta` tipi generic'i sınırlamaya düşürür.** `DataTable<Listing>`
story'lerinde `renderMobileCard`/`rowLabel` gibi callback'leri `args` yerine `render`
içinde ver, yoksa `row` tipi `{ id: string }`de kalır.

**`meta.args`'a `fn()` koyman prop'u o story dosyasında zorunlu kılar.**
`exactOptionalPropertyTypes` açıkken meta'daki `onRetry: fn()` prop'un tipini
`Mock`'a sabitler; "bu handler yok" demek isteyen story `onRetry: undefined`
yazamaz (TS2375) ve `undefined` geçmenin başka yolu da yoktur. Handler'ın
**yokluğu bir durumsa** (ErrorState'in tekrar denenemeyen hatası, `onApply`'siz
FilterBar) meta'ya koyma — ihtiyacı olan story kendi versin.

Faz 2 bunun **handler'a özgü olmadığını** gösterdi; beş component bağımsız olarak
aynı duvara çarptı. Sebep `Mock` tipi değil: `StoryObj<typeof meta>` meta.args'ın
_çıkarılan_ tipini prop tipiyle kesiştiriyor, dolayısıyla meta.args'a konan
**her** prop — `title: 'Metin'`, `description`, `listing`, `searchValue` — o
dosyada geri alınamaz oluyor. Kural genel: **yokluğu bir durum olan hiçbir prop
meta.args'a konmaz, tipi ne olursa olsun.** PageHeader'da yalnız `title`,
TopBar'da yalnız `currentUser` meta'da. Prop'u `render` içinde args'tan ayıklamak
da bir çıkış (ChartCard → `WithoutDescription`).

**Etiketi `visibility: hidden` ile gizleme — erişilebilir ad kaybolur.**
Erişilebilir ad hesabı `visibility: hidden` alt ağacını yok sayar. Button'ın
yükleniyor durumu tam olarak bunu yapıyordu: buton `loading` iken **adsız**
kalıyor, ekran okuyucu "düğme, meşgul" deyip hangi düğme olduğunu söylemiyordu.
Testler geçiyordu, çünkü hiçbiri yüklenen butonu **adıyla** sorgulamıyordu.
Yerini koruyarak gizlemek gerekiyorsa `opacity: 0` kullan — metin erişilebilirlik
ağacında kalır. (IconButton etkilenmiyordu: adı `aria-label`'dan geliyor.)
Regresyon testi: `Button.stories.tsx` → `LoadingKeepsAccessibleName`.

Faz 2 bu tuzağın dört kardeşini daha ölçtü. Hepsi aynı soruya bakıyor —
**erişilebilir ad hesabına ne girer, ne girmez:**

- **`display: none` de alt ağacı addan siler**, ve responsive gizlemenin ilk
  refleksi tam olarak odur. Yeri boşaltıp adı korumanın tek yolu medya sorgusu
  içinde sr-only kalıbına (`clip-path` + 1 piksel) geçmek.
- **Base UI `Avatar.Fallback` baş harfleri ada sızdırıyor.** Kaynağında tek bir
  aria attribute'u yok (`avatar/fallback/AvatarFallback.js`): "EK"yi sıradan bir
  `<span>`'e yazıyor. Avatar adını içeriğinden hesaplayan bir kabın (tıklanabilir
  kart butonu, satır linki) içine konunca butonun adı **"EK Elif Kaya, Moderatör…"
  diye başlıyor**; ekran okuyucu kullanıcısı her satırda önce iki anlamsız harf
  duyuyor. `AvatarProps`'un JSDoc'u "dekoratiftir, `alt` boş bırakılır" diyor ama
  fallback `alt` değil düz metin — niyet doğru, uygulama eksik. TopBar ve
  UserSummaryCard Avatar'ı `aria-hidden="true"` sarmalayıcıya koydu (bilgi kaybı
  yok: ad zaten yanında yazılı) ve adın **başını** regex'le ölçüyor
  (`/^Ayşe Demir/`). Kalıcı çözüm `Avatar.tsx`'te Fallback'e `aria-hidden`
  koymak; SellerPanel ve DataTable'ın kullanıcı kolonu aynı tuzağa girecek.
  Dikkat: `AvatarProps.status` kullanılıyorsa sarmalayıcı onun `aria-label`'ını
  da yutar — nokta dışarıda bırakılmalı.
- **Base UI `Switch`'in `description`'ı adın İÇİNE karışıyor.** `SwitchRoot`
  `nativeButton = false` varsayılanıyla `<span role="switch">` + gizli input
  render ediyor; `useAriaLabelledBy(..., enableFallback = !nativeButton)` gizli
  input'un `.labels`'ından sarmalayan `<label>`'ı bulup `aria-labelledby`'yi ona
  bağlıyor (`internals/labelable-provider/useAriaLabelledBy.mjs`). Ad label'ın
  **tüm** metninden hesaplanıyor: `description` verilirse anahtarın adı "Öne
  Çıkan" değil "Öne Çıkan Aktif · Satın alındı · Bitiş: 24 Tem 2026 09:00" olur —
  yani **veri değiştikçe ad değişir**. PromotionFlagsPanel kayıt özetini bu yüzden
  `description`'a değil anahtarın yanındaki kendi elementine koydu;
  `SwitchNameIsJustTheLabel` beş anahtarı da adıyla sorguluyor. (Aynı kaynak
  `aria-disabled` tuzağını da doğruluyor: kontrol native `<button>` değil.)
- **`role="treeitem"`in adı alt ağacını yutar.** Adını "içerikten" hesaplıyor ve
  içine gömülü `role="group"`u da hesaba katıyor: açık "Konut" düğümü ekran
  okuyucuda "Konut Daire Rezidans Müstakil Ev Villa…" diye okunuyor. Çözüm:
  `aria-labelledby` satır kutusunu göstersin, grup o kutunun dışında kalsın. İç
  içe ARIA yapısı kuran her component'i ilgilendirir (ileride Accordion, iç içe
  DataTable). Ölçüm: `CategoryTree.stories.tsx` → `NodeNameExcludesSubtree`.

**Global reset yalnız `body`'nin margin'ini sıfırlıyor.** Yazdığın `<p>`,
`<h*>`, `<fieldset>` tarayıcı varsayılanlarını taşır; grid/flex kabında bu
margin `gap` token'ının üstüne biner ve dikey ritmi token'lar değil tarayıcı
belirler. EmptyState'te `compact` ile `default` arasındaki fark tamamen bu
yüzden kaybolmuştu — testler bunu görmez, ekran görüntüsü görür.

Faz 2'de aynı resetin dört uzantısı daha çıktı:

- **`<ul>`/`<ol>` ayrıca 40 piksel `padding-inline-start` taşır.** Yalnız
  margin'i sıfırlamak yetmez; liste sağa kaymış görünür. Semantik listeye
  ihtiyacın varsa (moderasyon geçmişi sıralıdır, `<ol>` doğru element)
  `listStyle: 'none'` + `margin: 0` + `padding: 0` üçünü birden yaz.
- **`<fieldset>`'in `min-inline-size: min-content` varsayılanı küçülmeyi
  reddeder.** Spec'ten gelir ve grid/flex kabında 320 pikselde en uzun
  çocuğu kadar genişleyip sayfayı yatay kaydırtır. `minInlineSize: 0` şart.
- **`<dd>` 40 piksel `margin-inline-start` taşır** — `<ul>`/`<ol>` ile aynı
  sayı, **farklı özellik**; yukarıdaki "padding'i sıfırla" reçetesi onu
  düzeltmez. `<dl>` de kendi margin'ini taşır. Ad-değer çifti için doğru
  element `<dl>`/`<dt>`/`<dd>` (ListingFacts, UserSummaryCard, LocationPanel
  üçü de kullanıyor), ama üçü birden sıfırlanmadan değerler terimlerinden
  40 piksel sağda başlar ve dikey ritmi `gap` değil tarayıcı belirler.
- **`<caption>` varsayılan olarak ortalıdır.** Bölüm başlığı olarak
  kullanılınca tablonun üstünde ortada durur; `textAlign: 'start'` gerekir.

**Base UI `NumberField`'ın yerel ayarı varsayılan olarak kullanıcının
makinesidir.** `locale` verilmezse aynı değer Türkçe makinede `2.000.000`,
İngilizce makinede `2,000,000` görünür — Türkçede virgül ondalık ayırıcı olduğu
için fiyat milyon katı yanlış okunabilir, üstelik CI/Chromatic çıktısı runner'ın
diline göre değişir. NumberInput ve CurrencyInput `locale="tr-TR"` sabitliyor;
yeni bir Intl tüketicisi eklersen aynısını yap (`formatCurrency` de `tr-TR`
sabitliyor — aynı ekranda iki biçim olmamalı).

**Aynı tuzağın tarih hâli daha kötü: saat dilimi de makinenin.** `Intl`'e
`timeZone` verilmezse `2026-05-03T12:00:00+03:00` İstanbul'da `12:00`, UTC
runner'da `09:00`, Los Angeles'ta **`2 May 23:00`** görünür — yalnız saat değil
_gün_ kayar. Moderasyon geçmişinde bu, "karar hangi gün verildi" sorusunu
makineye göre farklı cevaplar. `utils/formatDateTime.ts` hem `tr-TR` hem
`Europe/Istanbul` sabitliyor; tarih gösteren her yer oradan geçmeli.

**Koordinat hâli ise en kötüsü: değer yanlış okunmuyor, _ayrıştırılamıyor_.**
Para ve tarihte kullanıcı yanlış bir değer görür; koordinatta çiftin kendisi
bozulur — `40.9888, 29.0277` Türkçe biçimlendiricide `40,988800, 29,027700`
olur: üç virgül var ve hangisinin ondalık, hangisinin ayırıcı olduğu belirsiz.
Kural: **koordinat, kimlik ve teknik tanımlayıcılar `toFixed` ile yazılır,
`Intl`'e sokulmaz.** (LocationPanel.)

**Göreli zaman ("3 gün önce") yazma.** Hesabı "şimdi"ye dayanır: aynı story
dün "3 gün önce", bugün "4 gün önce" yazar. Brifing fixture'ların
deterministik olmasını şart koşuyor ve göreli zaman bunu tek başına bozar —
Chromatic her gün fark üretir, gerçek regresyon o gürültüde kaybolur.
Gerekirse `now` prop'la dışarıdan verilmeli; component saati kendi okumamalı.

**`toBeDisabled()` Base UI kontrollerinde yalan söyler.** Checkbox bir
`<span role="checkbox">` render ediyor ve devre dışılığını `aria-disabled`
ile bildiriyor; `toBeDisabled()` yalnız native `disabled` attribute'unu tanır
ve kutu gerçekten kilitliyken de düşer. Yani matcher yanlıştır, component
değil — `toHaveAttribute('aria-disabled', 'true')` kullan. Gerçek
`<button>`/`<textarea>`'da (Button, Textarea) native matcher doğru araç.

Faz 2 aynı hatanın — **matcher yanlış, component değil** — beş kardeşini daha
buldu. Hepsi "test geçiyor ama hiçbir şey ölçmüyor" biçiminde:

- **`toBeVisible()` kırpma tekniğini görmez.** `display`/`visibility`/`opacity`'ye
  bakar; `clip-path` + 1 piksel ile görsel olarak gizlenmiş etiketi "görünür"
  sayar. visuallyHidden iddiası ancak `getBoundingClientRect().width` ile ölçülür.
- **`queryByText` `aria-hidden` alt ağacını dışlamaz.** "Avatar baş harfleri
  erişilebilirlik ağacına sızmamalı" iddiası
  `expect(queryByText('AD')).not.toBeInTheDocument()` diye yazılırsa **her zaman
  düşer** — metin DOM'da duruyor, gizli olan erişilebilirlik ağacındaki hâli.
  Doğru ölçüm: elemanı bul, `closest('[aria-hidden="true"]')` ile gizli atasını
  doğrula.
- **`queryByRole` ise `aria-hidden` alt ağacını _dışlar_** — bu yüzden
  "aria-hidden içinde odaklanılabilir öğe yok" iddiası rol sorgusuyla ölçülemez,
  test sessizce dişsizleşir.
  `canvasElement.querySelector('[aria-hidden="true"] [tabindex]')` ile ölç.
- **`queryByRole('img')` dekoratif görseli (`alt=""`) hiçbir zaman bulamaz**;
  "görsel yok" iddiası her koşulda geçer. `canvasElement.querySelector('img')`.
- **`toHaveTextContent('Var')` alt dize arar** ve `'Var (eklendi)'` ile de
  eşleşir: "bu hücre değişmedi" iddiası tek başına bu matcher'la yalan söyler.
  Olumluyu olumsuzla birlikte yaz (`not.toHaveTextContent('eklendi')`).
- **Açık Base UI dialog'u sayfanın kalanını `aria-hidden` yapar**, dolayısıyla
  `within(canvasElement).getByRole(...)` çekmece açıkken arka plandaki
  element'leri **bulamaz**. Arka planı ve portalı aynı anda ölçen test rol
  sorgusu yerine `document.querySelectorAll` kullanmalı.

Lehimize çalışan bir davranış da var: **`getByText` yalnız DOĞRUDAN metin
çocuklarına bakar** (`getNodeText`), atayı bulmaz. "Konut" kökünü Arsa'nın
"Konut İmarlı"sından ayırmanın tek sağlam yolu bu — ad sorgusu ikisini
karıştırır. Sayıya dayalı iddialar (`getAllByText(...)` → `toHaveLength(2)`)
da bu yüzden güvenilir.

**Türkçe regex'i küçük harfle yazma.** `/açık şikayet$/` "Açık şikayet"
etiketiyle eşleşmez; iddiayı ona dayandıran test doğru sebeple geçmez.
`/\d+ açık şikayet/` gibi metnin gerçek hâlini yaz.

**Prop tipi olmayan import'larda da `.tsx` içinde göreli yol kullan.** Ev
kuralı: `@/` yalnız `.css.ts`'te (`@/tokens/contract.css`). Component
dosyalarının tamamı göreli yol kullanıyor; react-docgen'in `@/`'yi çözememesi
zaten bilinen tuzak, kuralı dosya bazında değil dizin bazında tutmak onu
tamamen ortadan kaldırıyor.

### a11y kapısı 'error' — 26 ihlalin ayrıştırılması

`preview.tsx`'te `a11y.test: 'error'`. Kapı Faz 2 kapanışında çekildi; o an
düşen 26 test **iki ayrı aileydi ve zıt yönde çözüldü**. Ayıran soru tek:

> İhlal uygulamada da doğar mı, yoksa yalnız story bir sayfanın yapamayacağı
> şeyi yaptığı için mi doğuyor?

**Gerçek kusur → component düzeltildi (11 test).** Muafiyet almadılar:

- **`scrollable-region-focusable` (6): kaydırma kapları klavyeye kapalıydı.**
  Modal/Drawer gövdesi, DataTable ve RolePermissionMatrix'in scroller'ı
  `overflow` taşıyor ama içinde odaklanılacak bir şey yoksa klavyeyle
  gezilemiyordu — ve tam da **salt okunur** hâlde yoktu: düzenlenebilir matriste
  kutular kabı klavyeye açıyordu, `readOnly`'de kutular rozete dönüşünce tablo
  yalnız fareyle kaydırılabilir kalıyordu. Yani aynı component, yetkisi olmayan
  kullanıcı için erişilemez. Hepsine `tabIndex={0}`. **`role="region"` bilerek
  verilmedi:** rol landmark üretir, adı benzersiz olmak zorundadır ve sayfa
  başına birden çok tablo/çekmece olacak — kural gereği olmayan bir landmark
  eklemek `landmark-unique`'i kendi ürettiğimiz gürültüyle doldururdu.
- **`color-contrast` (7):** dördü `status.*.solid` slotuyla (sapmalar tablosu),
  üçü `text.disabled`'ın **bilgi taşıyan metinde** kullanılmasıyla kapandı —
  Tag'in disabled etiketi (3.86) ve ListingCard'ın "Görsel yok" yer tutucusu
  (4.34). WCAG'in düşük kontrastı bağışladığı yer "etkin olmayan **kontrol**";
  Tag bir `<span>`, "Görsel yok" düpedüz bilgi — muafiyet ikisinde de tutmuyor.
  `text.muted`'a geçildi (6.15 / 6.92). Global `text.disabled` **değişmedi**:
  gerçekten devre dışı native kontroller (axe onları zaten atlıyor) soluk kalmalı,
  "devre dışı" affordance'ı tam da düşük kontrasta dayanıyor.
- **`aria-hidden-focus` (1):** `Pie`'ın `rootTabIndex`'i — yukarıdaki Recharts
  maddesine bak.

**Canvas artefaktı → story muafiyet aldı (15 test).** Hepsi tek kalıp: _aynı
landmark'ı tek canvas'ta N kez çizmek._ VariantsComparison ve "üç durumu yan yana
göster" bir component'in üç kopyasını aynı anda çiziyor; landmark sahibi bir
component'te (AppShell'in `<main>`'i, TopBar'ın `<header>`'ı, SidebarNav'ın
"Ana menü"sü, SellerPanel'in "İlan sahibi"si) bu üç özdeş landmark üretiyor.
Uygulamada bir AppShell, bir TopBar, bir SidebarNav var; landmark adları
component'te sabit yazılı olduğu için story kopyalara ayrı ad da veremiyor.
Muafiyetin tanımı ve sınırları **tek yerde**: `src/storybook/a11y.ts` →
`cokluKopyaLandmarkMuafiyeti`.

**Kapı 'error' olunca play, DOM'u OTURMUŞ bırakmalı.** Kapının kendisinin ürettiği
tek yeni tuzak bu ve ölçüldü: Base UI popup açıkken odak tuzağı için
`aria-hidden="true"` + `tabindex="0"` taşıyan koruma span'leri
(`data-base-ui-focus-guard`) basıyor. Kasıtlılar ve popup'ın ömrüyle sınırlılar,
ama axe için `aria-hidden-focus` ihlali. Play bittiğinde axe çalışıyor; popup'ın
**kapanma animasyonu** o an sürüyorsa korumalar DOM'da duruyor ve story
**yazı-tura** düşüyor — `Select`'in iki story'si beş koşuda üç kez düştü, aynı
kod. `'todo'` iken görünmüyordu çünkü ihlal raporlanıp geçiliyordu; kapıyı
çekmek gizli yarışı görünür hâle getirdi.

Çözüm muafiyet değil, **kapanışı beklemek** (`Select.stories.tsx` →
`popupKapanmasiniBekle`): ihlal ne gerçek bir kusur ne de artefakt — testin
kendi bıraktığı artık. Portal açıp kapatan (Select, MultiSelect, Modal, Drawer,
Popover, Tooltip) her yeni story bu tuzağa girebilir; bir `waitFor` bedeli.
Dikkat: **açık bırakılan** popup sorun değil (ölçüldü — açık dialog'la biten
story geçiyor); sorun tam olarak _kapanırken_ bitirmek.

**Muafiyet gerçek gerekliliği kapatmıyor — kapatmamalı.** Faz 3'ün ekranlarında
aynı sayfada gerçekten birden çok gezinme landmark'ı olacak (SidebarNav'ın "Ana
menü"sü + PageHeader'ın "Sayfa yolu" kırıntısı) ve adlarının benzersizliği orada
GERÇEK bir gereklilik; ikisi farklı ad taşıdığı için kural zaten geçiyor.
Muafiyet story bazında verildiğinden **ekran story'leri kapıyı tam açık
devralıyor — onlara eklemeyin.**

İki artefakt sanılan şey aslında değildi, ölçerek ayrıldı:

- **AppShell'in `<main>`'i** için muafiyet alınmadı; ihlali üreten şey örnek
  sayfanın baştan sona **metin** olmasıydı. Kuralı kapatmak yanlış cevap olurdu:
  hiçbir gerçek moderasyon kuyruğunda tek bir düğme bulunmaması mümkün değil —
  düzeltilen şey kabuk değil, gerçekçi olmayan örnek. (`<main>` atlama
  bağlantısının hedefi olduğu için `tabIndex={-1}` kalmalı; `0` yapmak main'i
  tab sırasına sokardı.)
- **SidebarNav'ın rayı ve çekmecesi ikisi de `aria-label="Ana menü"`** diyor ama
  bu ihlal **değil**: çekmece kapalıyken portal içeriği hiç render edilmiyor,
  açıkken Base UI sayfanın kalanını `aria-hidden` yapıyor — ikisi aynı anda
  erişilebilirlik ağacında olmuyor. `MobileDrawer` story'si geçerek doğruluyor.

### Faz 2'de çıkan yerleşim tuzakları

**`position: sticky` en yakın kaydırma kabına yapışır — sayfaya değil.**
AppShell'in `<main>`'ini mobilde kaydırma kabına çevirmek ModerationActionBar'ı
_sessizce_ bozar: çubuk ekranın altına değil içeriğin sonuna oturur. Bu yüzden
`overflow` yalnız ≥48rem'de veriliyor; orada tam tersi isteniyor (çubuk main'in
kutusuna yapışsın). Testler bunu görmez, ekran görüntüsü görür.

**Kabuk slot'unu `display: none` ile gizleme — `display: contents` kullan.**
`none`, çekmecesini portal'sız (kendi içinde `position: fixed`) çizen bir menüyü
yok eder: menü DOM'da durur ama hiç boyanmaz. `contents` kutuyu siler, çocuğu
bırakır — düzenden çıkarmanın doğru aracı budur. (Adı da siler; yukarıdaki
erişilebilir ad ailesine bak.)

**`minWidth: 0`'ı metni saran tarafa yaz, sabit genişlikli kontrol taşıyan
tarafa asla.** Refleks `minWidth: 0`'ı eylem kutusuna yazmak, ama flex öğesinin
`min-width: auto` varsayılanı o kutuyu **en geniş butonun altına inmekten koruyan
şey**: sıfırlanınca uzun başlıklı sayfada shrink orantılı dağılır, eylem kutusu
butondan dar kalır ve buton dışarı taşar — yani `minWidth: 0` tam olarak
önlemeye çalıştığı yatay kaydırmayı üretir. Daralması gereken taraf başlık
bloğudur, çünkü metni sarabilen odur. Ölçüm: PageHeader → `LongContent` ve
`ActionsOverflow`, `scrollWidth <= clientWidth`.

**`overflow-wrap: anywhere` şart, `break-word` değil.** Flex öğesinin otomatik
minimum boyutu `min-content`'tir; `break-word` min-content'i değiştirmez,
`anywhere` değiştirir. Uzun bir değer dizgisi (`1.284.937.512 ₺`) flex kabında
ancak `anywhere` ile küçülüp sarar.

**`overflow: hidden` + kabı kaplayan `<button>` = kırpılmış odak halkası.**
Global `:focus-visible` outline'ı `outlineOffset: 0.125rem` ile kutunun dışına
taşıyor; atada `overflow: hidden` varsa onu yutuyor. **ListingCard'da bu
kombinasyon şu an duruyor** (card recipe'i `overflow: hidden` + `clickRegion`
butonu) — muhtemel bir Faz 1/2 hatası, ekran görüntüsüyle doğrulanmalı.

**Odak halkası, odaklanan elemanın TAMAMINI çevreler.** İç içe listede odaklanan
eleman `<li role="treeitem">` ise ve düğüm açıksa, li bütün alt ağacını kapsar:
halka "Konut"un değil "Konut + yedi çocuğunun" etrafına çizilir ve odaktaki satır
kaybolur. Halka li'de kapatılıp satır kutusuna taşınmalı. Ölçüm: CategoryTree →
`FocusRingIsOnTheRowNotTheSubtree`, li'nin kutusunun satırın en az beş katı
olduğunu piksel piksel doğruluyor.

**İç içe liste + satır tıklaması = ata sessizce seçilir.** `onClick` `<li>`'de
olursa çocuğun olayı bütün atalarına kabarır ve en dıştaki ata **en son** seçilen
olur: "Daire"ye basan kullanıcı "Konut" seçili bulur. Tıklama, alt listeyi
içermeyen satır kutusuna konmalı — kabarma orada biter. Ölçüm:
`ChildClickDoesNotSelectAncestor` çağrı **sayısını** ölçüyor.

**`aspect-ratio` yer tutucuyu deli gömleğine çevirir.** `4/3` verilen bir harita
çerçevesi 320 pikselde ~216 piksele **kilitlenir** ve içindeki EmptyState (ikon +
başlık + üç satır açıklama) kesik kenarlığın dışına taşar — yer tutucunun içeriği
kendi çerçevesinden taşıyorsa yer tutmuyor demektir. `minBlockSize: 'fit-content'`
oranı **taban** yapar: küçük içerikte oran korunur, büyük içerikte kutu uzar.

**Skeleton'ın `height: 1em`'i gerçek metnin satır kutusundan kısadır.** Metin
`1em × line-height` kadar yer kaplarken (3xl + tight = 2.34rem) iskelet 1.875rem
kalır: "skeleton aynı yeri kaplar" varsayımı büyük fontlarda yanlış ve veri
gelince yarım satır zıplar. Kap `minBlockSize: calc(1em * var(--line-height-tight))`
ile sabitlenmeli. Skeleton'ı büyük bir metnin yerine koyan herkesi ilgilendirir.

**`borderCollapse: 'collapse'` ile yapışkan sütun birlikte çalışmıyor.**
Birleştirilmiş kenarlıkta kenarlık hücrenin değil **tablonun** mülkiyetindedir;
yapışkan sütun kaydırılırken kenarlığını beraberinde taşımaz ve altındaki
hücrelerin üstünde kenarlıksız yüzer. `'separate'` + `borderSpacing: 0` + hücre
başına kenarlık şart. (DataTable `'collapse'` kullanıyor ama onun yapışkan sütunu
yok — kopyalayan yanılır.)

**Yapışkan sütunun z-index'i sayfanın yapışkan çubuklarıyla yarışır.** Matrisin
`z.sticky`'si TopBar ve BulkActionBar'ın `floating` varyantıyla aynı yığın
bağlamındaydı; kaydırma kabına `isolation: 'isolate'` konunca matrisin z-index'i
matrisin içinde kalıyor.

**Zebra/hover ile diff çakışır — ikisini birden isteme.** Üçü de hücre zeminini
boyuyor, oysa `diff` varyantında zemin **tek bilgi taşıyıcısıdır**: şeridin
altında kalan "izin kaldırıldı" işareti varyantın tek işini yapamaz hâle getirir.
RolePermissionMatrix'te zebra ve hover bu yüzden **bilerek yazılmadı** (CSS'te
gerekçesiyle yorumlu); dört sütunda satırı izlemeye hücre kenarlıkları yetiyor.

**Ölçü token'ı boşluğu: `space[24]` (6rem) ile `container.sm` (40rem) arası boş.**
Bir matrisin satır-başlığı sütunu ~15-25rem ister ve arada token yok. Sütuna
`minWidth` uydurmak yerine **tabloya** `minWidth: container.sm` verildi: 320
pikselde etiketler kelime kelime kırılmak yerine kaydırma çubuğu çıkıyor, geniş
ekranda `width: 100%` devralıyor.

**Faz 3 uyarısı — o cümlenin ikinci yarısı YALANDI ve düzeltildi:** kaydırma
çubuğu çıkmıyordu, **sayfa** 604 piksele genişliyordu. İki ayrı sebep vardı ve
ikisi de düzeltildi: `scroller`'ın `minWidth: 0`'ı yoktu (grid öğesi, min-content'e
çivilenmişti) ve `position: relative`'i yoktu (mutlak konumlu gizli etiketleri
kırpamıyordu — yukarıdaki `overflow` maddesine bak). **Ölçüm iddiası yazılmadan
"çalışıyor" denmiş bir davranıştı; ekran görüntüsü söyledi, testler değil.**

**Token boşluğu ise ÜÇ kez daha vurdu** (`ListingListPage`'in başlık sütunu,
`ListingReviewPanel`'in yan rayı, `AuthScreen`'in giriş kartı ~24rem istiyor).
Faz 2 "aynı ihtiyaç tekrarlarsa token eklemek doğru olabilir" demişti — tekrarladı.
Ekranlar ham `rem` uydurmak yerine `container.sm`'e ya da `fr` oranına düştü;
`AuthScreen`'in kartı bu yüzden 1440'ta geniş okunuyor. **Token eklemek artık
gerekçeli.**

**Kart `<button>` olabiliyorsa bütün çocukları phrasing content olmak zorunda.**
Buton içine akış içeriği (`<p>`, `<div>`) koymak geçersiz HTML'dir ve tarayıcılar
sessizce farklı yorumlar. Bu, reset tuzağıyla kesişiyor: oradaki her zamanki
çözüm ("yazdığın `<p>`'nin margin'ini sıfırla") burada **uygulanamaz**, çünkü
element seçimi zorunlu — her şey `<span>` + `display: flex/grid`. `onClick`
alabilen her component'te tekrarlanacak (StatCard, ReportCard, ListingCard).

**Medya sorgusu viewport'a bağlıdır, kabın genişliğine değil.** Repoda container
query yok: "mobilde dikey sıralanır" iddiası dar bir decorator kabında play ile
**ölçülemez**. Dikey sıralamanın kendisi ekran görüntüsünün işi; play yalnız
yatay taşmayı ölçebilir.

### Faz 3'te ölçülen tuzaklar — hepsi yeni, hepsi ölçüldü

**`overflow: hidden`, kapsayan bloğu OLMADIĞI mutlak konumlu torunu KIRPMAZ — ve
`clip`'li gizli etiketler sayfayı yatay kaydırtır.** Faz 3'ün en pahalı hatası ve
tek başına hiçbir testin göremeyeceği cinsten. RolePermissionMatrix 320 pikselde
sayfayı **604 piksele** genişletiyordu. Suçlu tablo değildi (tablo scroller'ında
düzgünce kırpılıyor): hücrelerdeki `Checkbox`'ların `hideLabel` etiketleri —
`position: absolute` + `width: 1px` + `clip: rect(0,0,0,0)`. Scroller
`position: static` olduğu sürece o span'lerin **kapsayan bloğu değil**; span'ler
640 pikselik tablonun içindeki statik yerlerine göre konumlanıp (en sağdaki
`left: 603`) kabın dışına taşıyor ve viewport'un kaydırma alanını 604'e
çekiyorlardı. **`clip` onları görsel olarak siler ama kaydırma alanından
silmez** — görünmez 1 pikseller sayfayı kaydırtıyordu.

Teşhis şöyle ayrıştı (hepsi ölçüldü): kaba `contain: paint` vermek **düzeltiyor**
(kapsayan blok yapar), `overflow: hidden` vermek **düzeltmiyor**, `<tbody>`'yi
silmek düzeltiyor (kutular gider), tek tek her öğe "taşmıyorum" diyor ama
viewport 604'te ısrar ediyor. Çözüm: kaba **`position: relative`**. Aynı desen
`visuallyHidden` etiketi olan **her kontrolü bir kaydırma kabına koyan** herkesi
ilgilendirir.

**Grid öğesinin `min-width` varsayılanı `auto`'dur, yani min-content — ve bu
ailenin dört üyesi vardı.** İz bildirilmezse örtük iz `auto` olur, tabanı
min-content'tir ve öğe onun altına inemez: kaydırması gereken kap kaydırmaz,
**sayfa** kaydırır. Faz 3'te dört yerde birden ölçüldü ve dördü de düzeltildi:

- **`Tabs.root`** yalnız satır izini bildiriyordu; `panel` içindeki geniş tablo
  izi 629 piksele kilitliyordu (`UserDetailPage`). `gridTemplateColumns:
'minmax(0, 1fr)'` eklendi (`vertical`'ın `1fr`'i de). Aynı hata component'in
  **kendi sözleşmesini** de deliyordu: `list` "sekmeler taşarsa kaydırılır"
  diyor ama iz max-content'e açıldığı için şerit hiç kaydırmıyordu.
- **`FieldShell.root`** — dokuz component'in altyapısı; `minmax(0, 1fr)` eklendi.
- **`FilterBar.rangeInputs`** — `1fr 1fr` izleri `<input>`un tarayıcı varsayılanı
  (~199px) + iki basamak = iz başına ~281 pikselde tabanlanıyordu; `numberRange`
  filtresi veren her tüketici ~590 pikselin altında taşıyordu.
- **`RolePermissionMatrix.scroller`** — `minWidth: 0` eklendi.

**`NumberInput.input`'a `minWidth: 0` yazmak bunu ÇÖZMEZ**: `min-width` bir
min-content katkısını yalnız **tabanlar**, asla tavanlamaz — tavanlayan şey izin
kendisidir (`minmax(0, …)`).

Kaçan tüketiciler tesadüfen kaçtı: **kaydırma kabı olan bir grid öğesinin
otomatik minimum boyutu sıfırdır**, o yüzden `overflow: hidden` taşıyan bir
sarmalayıcının içindeki tablo sorunu göstermiyordu (`DataTable`'ın `striped`
görünümü kurtarıyordu, `plain` kurtarmıyordu).

**`position: sticky` bir grid öğesine konursa sessizce hiç yapışmaz.** Sticky
kapsayan bloğuna hapsolur ve grid öğesinin kapsayan bloğu **kendi grid
alanıdır**: çubuğu bir grid satırına koymak onu kendi boyunda bir kutuya kilitler.
`ListingReviewPanel`'in kökü bu yüzden flex kolon, grid değil.

**Türkçe `İ` ile `i` `i` bayrağında EŞLEŞMEZ — iddia sessizce her koşulda
geçer.** `/işlem geçmişi/i` **"İşlem Geçmişi" ile eşleşmiyor**: JS'in `i` bayrağı
Canonicalize'ı `toUpperCase` üzerinden yapıyor; `'i'.toUpperCase()` `'I'`
(U+0049) verirken `'İ'` (U+0130) zaten büyük harf olduğu için kendisi kalıyor ve
ikisi eşit olmuyor. `u` bayrağı da kurtarmıyor (üçü de ölçüldü). "Audit sekmesi
yok" iddiası lowercase yazıldığında **sekme dururken bile geçiyordu**. Bu,
"Türkçe regex'i küçük harfle yazma" maddesinin mekanizması: `İ` ile başlayan her
kelimede (`İlan`, `İşlem`, `İletişim`, `İçerik`) yokluk iddiası dişsizleşir.
Kontrol grubu (aynı şeyin **var** olduğunu ölçen ikinci story) bu yüzden hayati.

**Story adları tip ve global adlarıyla yarışır.** İki kardeş ölçüldü:
`export const Error` modül kapsamında global `Error`'ı gölgeliyor → story
dosyasında `throw new Error(...)` yazılamıyor ("Error is not a constructor").
`export const Paginated`, import edilen `type Paginated` ile çakışıyor → TS2395
("Individual declarations in merged declaration must be all exported or all
local"). Zorunlu story adları (`Error`) verilmiş olduğu için ilkinden kaçış yok;
iddiaları `expect` + erken dönüşle yaz.

**Base UI popup'ın AÇILIŞ animasyonu da yarış üretir — kapanışın kardeşi.**
`Modal.css.ts` popup'ı `animation: scaleIn 180ms` + `from { opacity: 0 }`
kullanıyor; `findByRole` popup mount olduğu an çözülüyor ve `toBeVisible()`
animasyonun **ilk karesinde** koşuyor: computed opacity tam olarak `"0"` ve
jest-dom'un `isStyleVisible`'ı `opacity !== '0'` şartıyla reddediyor. Dialog
gerçekten açılıyordu, **ölçüm erkendi**. Çözüm zayıflatmak değil beklemek
(`dialogGorunurOlsun`, `popupKapanmasiniBekle`'nin simetriği).

**`document.querySelectorAll` Storybook'un kendi mobilyasını da yakalar.**
"Arka planı ve portalı aynı anda ölç" kuralı doğru ama kapsamı eksikti:
`document`'te `<table class="sb-argstableBlock">` (`<div class="sb-preparing-docs">`
içinde, `<body>`'nin doğrudan çocuğu) duruyor ve story'yle hiç ilgisi yok. Arka
plan iddiaları **`canvasElement.querySelectorAll`** ile yazılmalı; portal zaten
`within(document.body)` ile ayrıca ölçülür. Aynı mobilya ekran görüntüsü
ölçümlerini de kirletiyor: `document`'e sorarsan her ekranda bir
`<h1>No Preview</h1>` "bulursun" — ölçümü `#storybook-root`'a daralt.

**`getByText`'in "yalnız doğrudan metin çocuğu" davranışı, AYNI metnin ikinci
kopyasına karşı koruma DEĞİL.** "Konut"u "Konut İmarlı"dan ayırıyor (alt dize
değil doğrudan metin), ama `AttributeEditor` kapsamı okunur rozet olarak
basınca ("Konut", "Daire", "Villa") aynı metin ekranda **iki kez** oluyor ve
sorgu "Found multiple elements" ile düşüyor. Ayrım için **kapsam** gerekir
(`within(agac)`), doğrudan-metin davranışı değil.

**`CATEGORY_SUB_CATEGORIES[category].map(...)` derlenmez.** Sözlük kategori
başına _farklı dizi tipi_ taşıyor; TS dizi birleşiminde `.map`'i çağıramıyor. Ara
değişken şart: `const alt: readonly ListingSubCategory[] = CATEGORY_SUB_CATEGORIES[category]`.
İlk tüketicisi `CategoryAttributePage`'di.

**`pnpm test-storybook --run -- <yol>` FİLTRELEMEZ** — `--` geçince vitest 66
dosyanın hepsini koşuyor (~190 sn). Doğrusu `--`'siz: `pnpm test-storybook --run
src/screens/X` (~5 sn).

**`mcp__ide__getDiagnostics` bu repoyu tip denetlemiyor** — kasıtlı bir
`const x: number = "string"` için bile boş dönüyor. Yeşil ışık sanma; `pnpm
typecheck` çalıştır.

### Faz 2'de çıkan diğer tuzaklar

**`[hidden]`'ın `display: none`'ı tarayıcı stil sayfasından gelir; yazar stili
HER ZAMAN onu ezer.** Alt listeye `display: grid` yazıp `hidden={!açık}` vermek
kapalı grubu **açık bırakır**: `aria-expanded="false"` derken içerik ekranda
durur ve ekran okuyucu kapalı grubun bağlantılarını gezmeye devam eder
(erişilebilirlik ağacı da CSS'e bakar). `selectors: { '&[hidden]': { display:
'none' } }` elle geri konmalı. SidebarNav.css.ts'te belgeli;
`NestedGroupTogglesWithKeyboard` ve `ActiveChildOpensParent` ölçüyor.

**`useId` tek başına yetmez: aynı ağacı iki kez render eden component kapsam
öneki ister.** SidebarNav rayı ve çekmeceyi aynı ağaçtan çiziyor; iki kopya aynı
`useId` değerini paylaşınca `aria-controls` id'leri çakışıyor ve çekmecedeki ok
**rayın görünmeyen listesini** işaret ediyor. Sessiz hata: ekranda her şey doğru,
yalnız ekran okuyucu yanlış yere bakıyor. `useId` + `'rail'`/`'drawer'` öneki
gerekiyor; `ToggleControlsItsOwnList` ölçüyor. Aynı sebeple **sabit `id`
yazma**: iki kabuklu bir story (VariantsComparison) sabit id'yi patlatır ama
hiçbir test düşmez — atlama bağlantısı "çalışmaya" devam eder, yalnız yanlış
kabuğa gider. (React 19.2'nin `useId`'si `_r_0_` biçiminde üretiyor, eski `:r0:`
değil — fragment ve CSS selector'da güvenli, sanitize gerekmiyor.)

**`globals.css`'in `a` kuralı `text-decoration`'ı sıfırlamıyor.** `color` ve
`textUnderlineOffset` veriyor, altı çizgiyi bırakıyor: menüde her satır altı
çizili çıkar. Link class'ında `textDecoration: 'none'` şart. Ayrıca `a:hover`
(0,1,1) bir recipe base class'ının (0,1,0) **üstüne biner** — bu yüzden hover
kuralı base'e değil `active` varyantlarının içine yazılmalı; base'e yazılırsa
aktif satırın zemini hover'da kaybolur.

**Hesaplanmış birleşim anahtarı TS denetimini sessizce atlıyor.**
`güncelle({ [alan]: next })` — `alan: 'required' | 'filterable' | …` —
`Partial<Def>`'e giderken **değer tipi hiç denetlenmiyor**: `{ [alan]: 'bu bir
string' }` bile temiz derleniyor (tsc 6.0.3 + strict + `exactOptionalPropertyTypes`
ile izole doğrulandı; ara `Partial<Record<K, boolean>>` tipi de kurtarmıyor).
Çözüm: her bayrak kendi yazıcı fonksiyonunu taşısın
(`yaz: (next) => ({ required: next })`) — yanlış alan/tip TS2322 verir. Kopya
alıp tek alanı yazan hâl de (`const yeni: Flags = { ...flags }; yeni[key] = next`)
tip güvenli. **Fixture ve domain sözlüklerinde de aynı kalıp olabilir, taranmaya
değer.**

**Storybook'un viewport global'i UYGULANIYOR — Faz 3'te doğrulandı.** Faz 2 bunu
"doğrulanamadı" diye bırakmıştı; `ListingListPage` → `MobileCards` içinde ölçüldü:
`globals: { viewport: { value: 'mobile320' } }` verilen story'de
`window.innerWidth === 320` ve `canvasElement.clientWidth === 320` (vitest'in
varsayılanı 414 olsaydı 414 görürdük). **Yani medya sorgusuna bağlı geometrik
testler artık yazılabilir.**

Yine de iki uyarı duruyor: (1) repoda **container query yok**, dolayısıyla
"mobilde dikey sıralanır" iddiası dar bir decorator kabında değil ancak
viewport'la ölçülür; (2) `display: none` olan dal `getByRole`'e **görünmez** —
iki dalı birden render eden ekranlarda (`ListingListPage`, `UserManagementPage`,
`ReportManagementPage`) sorguyu kapsayıcıya daraltın ya da `{ hidden: true }`
kullanın, yoksa "found multiple elements" alırsınız.

**`<header>` Storybook'ta banner sayılır, uygulamada sayılmaz.** AppShell'in
`<main>`'i içindeki `<header>` landmark üretmez (banner üst seviyede oluşur, o
TopBar'ındır); Storybook canvas'ında gövdeye doğrudan bağlı render edildiği için
banner olur. Kritik bir axe ihlali değil, ama `getByRole('banner')`e dayanan play
testi **uygulamada karşılığı olmayan bir şeyi** ölçer — testleri `h1`/`nav`
üzerinden yaz.

**Recharts 3'te `accessibilityLayer` varsayılan `true`** ve grafiğin `<svg>`'sine
`tabIndex=0` + `role="application"` koyuyor (`container/RootSurface.js` ile
doğrulandı). Grafiği `aria-hidden` bir kaba koyup bunu kapatmazsan axe
`aria-hidden-focus` ihlali doğar: klavye oraya gider, ekran okuyucu "burada bir
şey yok" der. Story helper'ı `accessibilityLayer={false}` veriyor. Grafik kabına
`role="img"` vermek de naif çözüm — alt ağacı erişilebilirlik ağacından **siler**,
yani prop JSDoc'unun `children`'a koyulmasını istediği tablo/özet alternatifini
tam da o gizler; ad `<section>` + `aria-labelledby` ile kurulmalı.

**`accessibilityLayer={false}` yetmiyor: `Pie`'ın kendi kapısı var.** Faz 2
kapanışında ölçüldü — `Pie` `rootTabIndex` prop'u taşıyor ve **varsayılanı 0**
(`polar/Pie.js:554`), `accessibilityLayer`'dan tamamen bağımsız: kök
`<Layer>`'ına `tabIndex={0}` basıyor ve `aria-hidden` kabın içinde tab sırasına
giren bir `<g>` bırakıyor. Alan/çubuk/çizgi grafiklerinde bu prop yok, bu yüzden
yalnız pasta düşüyordu. `<Pie rootTabIndex={-1}>` şart. **Genel ders: bir
kütüphanede "erişilebilirliği kapat" tek bir anahtar olmayabilir** — grafik tipi
başına ayrı kapı olabilir, ve kapıyı yalnız o tipi render eden story ölçer.
Buradaki asıl hata testteydi: `ChartIsHiddenButSummaryIsNot` doğru şeyi ölçüyor
ama meta'nın varsayılan args'ıyla, yani **alan grafiğiyle** — iddia pastada hiç
sınanmıyordu. Ölçüm artık `CategoryDistribution`'ın kendi play'inde.

## Brifingden onaylanmış sapmalar

Bunlar tartışıldı ve kullanıcı onayladı. Geri alma.

Ayrıksı satırlar: **`FilterValue`, `FilterDefinition` ve
`PHOTO_REJECTION_REASONS` kullanıcıya sorulmadan, Faz 2'de karar verildi** —
brifing ilk ikisinde kendi kendisiyle çelişiyordu ve FilterBar onlarsız
yazılamıyordu; üçüncüsünde ise hiç konuşmamıştı (gerekçeler tabloda). Geri
alma, ama kullanıcı görünce itiraz ederse tartışmaya açık; diğer satırlar gibi
kapanmış sayma.

| Konu                             | Sapma                                                          | Gerekçe                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `erasableSyntaxOnly`             | Kapatıldı                                                      | `domain.ts` enum kullanıyor, enum çalışma anında kod üretiyor (TS1294)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `value?: T`                      | `value?: T \| undefined`                                       | `onValueChange` `undefined` veriyordu ama `value` geri almıyordu — gidiş-dönüş kırıktı                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `CheckboxProps.onChange`         | `onCheckedChange`                                              | Switch ile tutarlı; Base UI zaten `ChangeEvent` üretmiyor                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `InputProps`                     | `ref` eklendi                                                  | SearchInput temizleme sonrası odağı geri vermeli                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `CheckboxProps`                  | `hideLabel` eklendi                                            | Tablo satırında etiket her satırda tekrar edip tabloyu okunmaz yapıyordu                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `DataTableProps`                 | `rowLabel` eklendi                                             | Etiketsiz kullanıcı 12 satırda da aynı metni duyar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `InputProps`/`TextareaProps`     | `required` native'den çıkarıldı                                | `exactOptionalPropertyTypes` ile TS2320 çakışması                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `ListingFilterValues`            | `string[]` → `SellerType[]`/`PromotionType[]`                  | Brifingin kendi tip güvenliği kuralı                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Fixture opsiyonel tarihleri      | Koşullu spread                                                 | Brifingin kodu `exactOptionalPropertyTypes` ile derlenmiyordu (TS2375)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Durum renkleri                   | `paused`→nötr-200, `expired`→warning-100, `archived`→nötr-300  | 8 durum yalnız 6 farklı zemin üretiyordu                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `AdminPermission`                | `ThemeSetDefault` eklendi                                      | Matris tema seçimi ile sistem varsayılanını ayırmış, enum ayırmamıştı                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `AdminPermission`                | `UserEditProfile` eklendi                                      | Brifing 1.4 `moderator`'un kullanıcı düzenlemesine "Sınırlı" diyor ama enum yalnız tam yetkili `UserEdit`'i tanıyordu ve `ROLE_PERMISSIONS` moderator'a onu veriyordu: **matris sınırlarken kod tam yetki veriyordu.** Kapsam: ad, e-posta, telefon, avatar, firma adı                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `AdminPermission`                | `UserEditContact` eklendi                                      | Aynı hücrenin `destek` hâli ("Sınırlı destek alanları"), daha dar kapsam: yalnız e-posta ve telefon. `UserEdit` artık tam yetki olarak yalnız `superAdmin`'de                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `AdminPermission`                | `ReportTriageLimited` eklendi                                  | Matris `icerikDenetcisi`'nin şikayet triage'ına "Sınırlı" diyor, `ROLE_PERMISSIONS` tam `ReportTriage` veriyordu. Kademe okur, sınıflandırır, eskale eder; `severity` ve `assignedAdminId` değiştiremez                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `AdminPermission`                | `UserViewProfile` eklendi                                      | Matrisin **dördüncü ve son** "Sınırlı" hücresi (satır 304, "Kullanıcı görüntüleme" × `destek`); `ROLE_PERMISSIONS` oraya tam `UserView` veriyordu — çözülen üç hücrenin hatasının aynısı. Ayıran ilke **destek durumu açıklar, moderatör durumu belirler**: destek "askınız 29 Tem'de bitiyor" diyebilmeli, "neden askıya alındığını" okumak kararı veren rolün işi. Görünür: ad, avatar, tip, firma, `verified`, e-posta, telefon (destek `UserEditContact` ile zaten düzenliyor — göremediğini düzenlemek anlamsız), `status` + yürürlükteki yaptırımın `endsAt`'i, `createdAt`, ilan sayaçları, `reportCount`, kullanıcının kendi ilanları. Gizli: `UserSanction.reason` (iç gerekçe metni — müşteriye okunacak cümle değil), yaptırım geçmişi ve `createdByAdminId`, `lastLoginAt`, `adminRole`. `UserSummaryCard`'ın `security` varyantı = tam görünüm, `destek` görmez |
| `status.*` token'ı               | Dördüncü slot: `solid`                                         | Solid rozet zeminini `border`'dan okuyordu; kenarlık 3:1'e (WCAG 1.4.11), metin zemini 4.5:1'e borçlu — dört durum AA'dan düşüyordu (draft 2.56, pendingReview 3.18, changesRequested 4.09, published 3.29). Alternatif "600'leri koyulaştır" **reddedildi**: 600'ler ağırlıkla kenarlık/nokta olarak kullanılıyor (31 yer) ve zaten 3:1 ile geçiyorlardı, üstelik neutral-400'ü 4.5'e çekmek onu neutral-500'e yapıştırıp rampadan basamak siliyordu. Yan fayda: `paused` ile `archived` ikisi de neutral-600'e düşüp solid'de **aynı** görünüyordu (7/8) — kademe artık 500→600→700                                                                                                                                                                                                                                                                                        |
| `FilterValue`                    | `NumberRange` eklendi                                          | Brifing `numberRange` filtre tipi tanımlamış ama birleşimde aralık üyesi yok; tek `number` "en az 500.000" ile "en çok 500.000"ü ayıramıyor. `dateRange`'in `DateRange`'i zaten vardı, bu onun simetriği                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `FilterDefinition`               | `searchable` eklenmedi, 8 seçenek eşiği kondu                  | Brifing il/ilçe/mahalle'nin aranabilir olmasını şart koşuyor ama bayrak tanımlamamış; eşik (`ARAMA_ESIGI`) sözleşmeyi büyütmeden çözüyor                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| DTCG token JSON                  | Eklenmedi                                                      | Tasarımcı/Figma yok; gelince Style Dictionary ile eklenir                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `Button.test.tsx`                | Yazılmıyor                                                     | addon-vitest story testleri aynı işi yapıyor                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `AutomatedCheckItem`             | Silindi; panel `AutomatedCheckResult[]` alıyor                 | Kullanıcı onayladı. `ModerationSummary.automatedChecks` zaten o tip; ayrı DTO her ekrana elle çeviri yaptırıp `status`'ü enum'dan string'e düşürüyor ve `label`'ı domain'den component'e taşıyordu                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `PHOTO_REJECTION_REASONS`        | Fotoğraf reddine 7 gerekçelik alt küme                         | **Sorulmadan karar verildi.** Brifing fotoğraf reddinde de `RejectionReason`'ı kullanıyor ama alt küme tanımlamamış; "Fiyat Hatası" veya "Yanlış Kategori" bir fotoğrafın suçu olamaz, 15 seçenek yanlış gerekçe seçtirir                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `BaseFixtureArgs.revision`       | Eklendi (varsayılan 1)                                         | `moderationEvents.ts`'te `edited` olayı olan ilan revizyon 1'de kalamaz; fixture kendi geçmişiyle çelişemez                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Faz 3 — aşağıdakiler**         |                                                                |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `AsyncState`                     | `{ status: 'idle' \| 'loading' }` **iki üyeye bölündü**        | Anlam aynı, **daraltılabilirlik** değil: discriminant'ı birleşim olan üyeyi TS `===` ile eleyemiyor (yalnız `switch` çalışıyor), sonraki satırda `state.data` TS2339 veriyor. Beş ekran bağımsız olarak doğal deyimi yazıp aynı duvara çarptı — kusur ekranlarda değil sözleşmedeydi. tsc 6.0.3 ile izole doğrulandı                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `StatCardProps.sparkline`        | **Eklenmedi**; `variant` JSDoc'undaki "mini eğri" sözü silindi | Veri yedi KPI'ın yalnız ikisinde var (`dailyNewListings`, `dailyModerationCount`) ve o ikisi zaten aynı ekranda tam boy `ChartCard`. Üstelik repo kararı Faz 2'de zaten vermişti: `ChartCardProps.height`'ın `sm`'i "eksensiz mini eğri; sayıyı StatCard söyler" diyor — iki JSDoc çelişiyordu, StatCard'ınki yanlıştı                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| "Kesin konumu görme" izni        | **Eklenmedi**                                                  | Brifing 1.4'te "İlan görüntüleme" **dört rolde de "Tam"**; ayrı izin o satırı sessizce "Sınırlı"ya çevirir, yani matrisi kod üzerinden değiştirirdi (Faz 2'nin dört kademesi tam tersini yapmıştı). Brifing 1.1 (satır 183) `showExactLocation`'ı "**son kullanıcıya** gösterilip gösterilmeyeceği" diye tanımlıyor — public sitenin sorusu. Kalan şey gösterim kapısı: `ListingReviewPanelProps.revealExactLocation`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `ListingFactsProps.headingLevel` | **Eklenmedi**; varsayım doğrulandı                             | Tek tüketici (`ListingReviewPanel`) zinciri h1→h2→h3 kuruyor, yani `<h3>` doğruydu. Tüketicisi olmayan kanal açmak `sparkline`'da reddedilen hatanın aynısı olurdu                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `TopBarProps` bildirim kanalı    | **Açık bırakıldı**                                             | Faz 3'ün hiçbir ekranı TopBar render etmiyor (kabuk Faz 4'ün). Tüketici görünmeden karar vermek uydurmak olurdu                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `RolePermissionMatrixProps`      | `baseline` eklendi (varsayılan `ROLE_PERMISSIONS`)             | `diff`'in tabanı domain sabitine **gömülüydü**: `superAdmin` bir izni kaydettiği an sunucunun gerçeği sabitten ayrılır ve matris hiçbir şey değişmemişken "değişmiş" hücre gösterirdi. `SettingsPage` artık **kayıtlı** hâli taban veriyor. Görünür metin de düzeltildi ("varsayılan izinlerden farklı" → "önceki hâlinden farklı") — prop eklenip metin bırakılsaydı ekrandaki tek açıklama yalan söylerdi                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `SettingsPageProps`              | `savedRolePermissions` eklendi                                 | `baseline`'ın besleyicisi; brifing 3.5 "permission diff" düzenini zorunlu tutuyor ve tabansız kurulamıyordu                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `UserSummaryCardProps`           | `activeSanction` eklendi                                       | Brifing 2.6 "aktif yaptırım"ı görünen veri sayıyor; kart yaptırımın yalnız **tipini** durumdan türetip "neden"i ve "ne zamana kadar"ı susarak geçiyordu. Alanları varyanta göre açılır ve bu bir **yetki sınırı**: `detailed` yalnız tip + `endsAt` (destek'in yüzü), `security` ayrıca `reason` + `startsAt` + `createdByAdminId`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `SellerPanelProps`               | `activeListingCount` + `sanctions` eklendi                     | Brifing 2.6 "toplam ve aktif ilan sayısı"nı, 3.4 `risk` varyantının "yaptırım geçmişi"ni istiyordu; ikisinin de kanalı yoktu. `sanctions` yalnız `risk`'te; `revokedAt` dolu kayıt işaretlenir ama **düşürülmez** (kaldırılmış yaptırım da sicildir)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `ReportCardProps`                | `now`, `reporter`, `assignedAdmin`, `relatedReportCount`       | Brifing 2.8'in dört verisi kanalsızdı. `now` zorunlu çünkü component saati **kendi okuyamaz** (göreli zaman tuzağı). **`AdminUser` diye bir tip YOK** — admin de `UserAccount`, `adminRole`'ü dolu; AGENTS'ın eski önerisi (`assignedAdmin?: AdminUser`) var olmayan bir tipe atıfta bulunuyordu                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `LISTING_METRIC_LABEL`           | `labels.ts`'e eklendi                                          | `LISTING_FIELD_LABEL` yalnız kabın adını ("Metrikler") biliyordu; dört sayaç etiketsizdi. Ayrı sözlük çünkü anahtar uzayı `keyof ListingMetrics`, `keyof Listing` değil — içeri eklemek `satisfies` denetimini kırardı. Sahibi ekran: `ListingReviewPanel`'in metrik bloğu                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `fixtures/audit.ts`              | **Eklendi**                                                    | Brifingin dosya ağacında (5.3) **yok** ama ekranı (2.10) var; `AuditLogPage` ve `UserDetailPage`'in audit sekmesi fixture'sız render edilemezdi. Sekiz kayıt, altı `entityType`'ın hepsi. `action` kodları `AdminPermission` sözlüğünden (audit'e giren her eylem bir izin kapısından geçmiştir → `ADMIN_PERMISSION_LABEL[action] ?? action`). `metadata` sözleşmesi: `{ correlationId, before, after }` — brifing 2.10'un üç verisini `domain.ts`'e alan eklemeden taşıyor                                                                                                                                                                                                                                                                                                                                                                                                  |
| `ThemeSelector` / `CodeBlock`    | Ayrı component **yazılmadı**; ekran içinde kuruldu             | Brifing 2.9/2.10 "türetilen componentler"de anıyor ama **kendi yetkili katalogunda (3.3 + 3.4) ikisi de yok** ve Faz 3'ün kapsamı 11 ekran. Tema seçimi `RadioGroup` + `RadioOption.description` ile (**`RadioGroup`'ta `cards` varyantı YOK** — 3.3'ün "cards"ı story düzeni sütunu), JSON detayı `<pre>` ile                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `publishedListingCount`          | Etiket "Yayına alınan ilan" (brifing "Toplam yayındaki ilan")  | Fixture'ın kendi gerekçesi sayının bir **akış** olduğunu kanıtlıyor: `rejectionRate = 281/(3.100+281)` ancak iki sayı aynı pencereden gelirse anlamlı. Sayı korundu, ismi düzeltildi                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

## Teknoloji

React 19 · TypeScript 6 (strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`)
· Vite 8 · **Base UI** (headless primitive'ler) · **vanilla-extract** (`.css.ts`)
· React Router 8 · TanStack Query/Table/Form/Virtual · Storybook 10 · react-day-picker
(takvim; Base UI'da tarih primitive'i yok) · Recharts + lucide-react.

Faz 2'den iki not:

- **`SidebarNav` Router context'i gerektiren ilk component** (`Link` kullanıyor).
  Storybook'ta global `withRouter` var, ama SidebarNav'ı — ve onu saran
  AppShell'i — kullanan her yeni test/ekran bir Router içinde olmalı.
- **Recharts `Cell` 3.9'da deprecated** (4.0'da kalkacak, yerine `shape`/`content`).
  3.x'te çalışıyor; yalnız story kodunda kullanılıyor ve borç olarak notlanıyor.

## Component kalıbı

```
Button/
  Button.tsx         Component + JSDoc (props JSDoc'u component-props.ts'te)
  Button.css.ts      vanilla-extract
  Button.stories.tsx Story'ler
  index.ts           export
```

Props **`src/types/component-props.ts`**'te merkezi. Component kendi prop tipini
tanımlamaz, oradan import eder (göreli yolla!).

`src/components/internal/` katalog component'i değildir — `FieldShell` ve `listbox.css`
paylaşılan altyapıdır, doğrudan kullanılmaz.

## Doğrulama

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test-storybook --run && pnpm build-storybook
```

Hepsi geçmeden "bitti" deme. Ayrıca **gözle bak**: `pnpm storybook` (port 6007),
toolbar'dan üç temayı da dene.

## Durum ve sırada ne var

**Faz 1 bitti:** 26/26 primitive.
**Faz 2 bitti:** 29/29 composite. Son turda kalan 15'i yazıldı — kabuk
(`AppShell`, `SidebarNav`, `TopBar`, `PageHeader`), dashboard (`StatCard`,
`ChartCard`), yönetim (`RolePermissionMatrix`, `CategoryTree`, `AttributeEditor`)
ve detay panelleri (`UserSummaryCard`, `ReportCard`, `ListingFacts`,
`LocationPanel`, `SellerPanel`, `PromotionFlagsPanel`).

**Fixture'lar tamam:** `listings.ts`, `moderationEvents.ts`, `users.ts`,
`reports.ts`, `dashboard.ts`. Eksik yok.

**Faz 2 kapanışı bitti:** 11 ekranı bloke eden sözleşme boşlukları kapatıldı
(`AsyncState`'in `partialSuccess`/`unauthorized`'ı, revizyon çakışması kanalı,
`onRetry` ikilisi, `domain/categoryTree.ts`, üç etiket sözlüğü, iki
gerçekleştirilemez JSDoc) ve matrisin dördüncü "Sınırlı" hücresi
(`UserViewProfile`) karara bağlandı. **a11y kapısı `'error'`'a çekildi**, 26
ihlalin hepsi temiz — dökümü "a11y kapısı" bölümünde.

**Faz 3 bitti: 11/11 ekran.** `src/screens/` altında dört dosyalık kalıpla
(`DashboardStats`, `ListingListPage`, `ApprovalQueue`, `ListingReviewPanel`,
`UserManagementPage`, `UserDetailPage`, `CategoryAttributePage`,
`ReportManagementPage`, `SettingsPage`, `AuditLogPage`, `AuthScreen`).

**Ölçümler (Faz 3 kapanışı):**

- `format:check` + `lint` + `typecheck` + `test-storybook --run` + `build-storybook`
  **hepsi geçiyor**: 66 dosya, **1.191 test**, a11y kapısı `'error'` açıkken.
- **Manifest: 66 component, 495 prop, 0 açıklamasız**, react-docgen'in atladığı
  component **yok**. (Faz 2: 55 / 391 / 0.) Ekran tipleri belgelendi — **borç
  ikinci kez doğmadı.**
- **Story sayısı 912 → 1.257** (260'ı `Screens/`). Chromatic kotası açısından:
  1.257 × 3 tema × 2 viewport = **7.542 snapshot/build**, kota 5.000/ay. Matris
  daraltılmadan Chromatic **kurulamaz**.
- **320 pikselde yatay taşma: 11 ekranın hiçbirinde yok** (ölçüldü, aşağıya bak).

**Ekranlar kabuk DEĞİL.** `AppShell`/`TopBar`/`SidebarNav`/`PageHeader` render
etmiyorlar; Faz 4 onları kompoze edecek. Sonucu: ekranların `<h1>`'i yok, en üst
başlıkları `<h2>` (`AuthScreen` hariç — o kabuğun dışında yaşayan tam sayfa ve
kendi `<h1>`'ini basıyor). `ListingFacts`'in `<h3>` varsayımı bu zincirle
**doğrulandı**: h1 (PageHeader/Faz 4) → h2 (ekranın bölümü) → h3.

**Sırada: Faz 4** — router, `App` kabuğu, container katmanı, `SidebarNav`'ın
yetki süzgecinin gerçek yerine taşınması. Ekranlar veriyi prop olarak alıyor;
onları besleyecek katman yok.

**Faz 3 bitti.** Yukarıdaki listede açık bırakılan boşlukların **hepsi karara
bağlandı** ve aşağıda "KAPANDI" diye işaretli — `StatCardProps.sparkline`
(eklenmedi), `RolePermissionMatrixProps.baseline` (eklendi),
`UserSummaryCardProps.activeSanction` (eklendi), `SellerPanelProps`'un
sayaç/yaptırım boşlukları (eklendi), `ReportCardProps`'un üçlüsü (dördü eklendi),
`ListingFactsProps.headingLevel` (gerek yok, doğrulandı), metrik alan etiketleri
(`LISTING_METRIC_LABEL`), "kesin konumu görme" izni (gerekmiyor). Gerekçeler
sapmalar tablosunda.

**Açık kalan ikisi:** `TopBarProps`'un bildirim kanalı (Faz 3'ün hiçbir ekranı
TopBar render etmiyor — tüketicisi Faz 4'te doğacak) ve
`CategoryAttributeDefinition.updatedBy` (backend sözleşmesi). **Uydurma, sor.**

### Moderasyon grubunda kurulan yapılar

- **`domain/moderationActions.ts`** — brifing 1.2'nin geçiş tablosunun beş
  moderasyon eylemine düşen kesiti: hangi eylem hangi durumda görünür
  (`allowedFrom`), hangisi gerekçe/not zorunlu kılar. Yetki boyutu burada
  **yok**; onu `ModerationCapabilities` taşıyor ve `ROLE_PERMISSIONS` ile
  birebir örtüşüyor. Bir eylem iki kapıdan (yetki + durum) geçmeden görünmez.
- **`utils/formatDateTime.ts`** — `tr-TR` + `Europe/Istanbul` sabit.
- **`fixtures/moderationEvents.ts`** — dört zincir, hepsi gerçek ilan
  fixture'larının kendi tarihlerine bağlı (`approved` olayı ilanın
  `publishedAt`'i ile aynı an). On beş `ModerationEventType` değerinin hepsi
  kapsanıyor; `EveryEventTypeRenders` story'si bunu ölçüyor.
- **ModerationActionBar kararı kendi topluyor.** `ModerationDecisionPayload`
  gerekçe ve not istiyor, dolayısıyla buton doğrudan handler'ı çağıramaz: dialog
  açar, `RejectionReasonPicker` ile toplar. Onay/arşivde alan yok ama dialog
  yine açılır (brifing 2.4: karar öncesi doğrulama zorunlu). Dialog onayla
  kapanır; taslak state'te kalır ki başarısız kararda not kaybolmasın —
  `DraftSurvivesRevisionConflict` bunu artık **ölçüyor** (sözleşmenin bu sözü
  Faz 2 boyunca ölçülmeden duruyordu).
  Kapanışta `decisionError` kanalı eklendi ve **çubuk onu render ediyor**:
  reddedilen kararı `danger` bir `Alert` ile bildiriyor. Çakışmada uyarının
  tekrar deneme butonu **yok** — aynı damga aynı çakışmayı üretir, damgayı
  yenilemek görülmemiş içeriği onaylamak olur; doğru eylem yeniden yükleyip
  yeniden bakmak, o da sayfanın işi. Prop'u eklerken JSDoc'una "sebebi gösterir"
  diye yazıp component'i bağlamamak, tam da bu turda düzeltilen
  "gerçekleştirilemez JSDoc" hatasının kendisi olurdu.

### Faz 2'nin son turunda kurulan yapılar

- **Dört izin kademesi** (`UserEditProfile`, `UserEditContact`,
  `ReportTriageLimited`, `UserViewProfile`) ve `ROLE_PERMISSIONS`'ın brifing
  1.4'e uydurulması — gerekçeler sapmalar tablosunda. Matrisin **dört "Sınırlı"
  hücresinin dördü de** artık karşılıklı; açık kalan yok. Kademeler **dışlayıcı
  değil kapsayıcıdır**: `superAdmin` hem tamına hem sınırlısına sahip.
  Dolayısıyla "bu kullanıcı sınırlı mı?" sorusu `includes(UserEditContact)` ile
  **cevaplanamaz** — yetki sınayan kod önce tamını (`UserView` / `UserEdit` /
  `ReportTriage`) sorsun, sınırlı kademeye ondan sonra düşsün; ters sıra
  `superAdmin`'e daraltılmış görünümü verir.
- **`fixtures/users.ts`** — altı hesap (bireysel, emlak ofisi, inşaat firması,
  doğrulama bekleyen, askıya alınmış, banlanmış) + dört admin (her `AdminRole`
  bir kez) + iki `UserSanction` (`activeSuspensionSanction`,
  `permanentBanSanction`) ve `userByStatus`/`userByRole`/`userByType` indeksleri.
- **`fixtures/reports.ts`** — yedi şikayet; `reportByStatus`/`reportBySeverity`
  indeksleri. `kadikoyApartmentReports` aynı ilana bağlı üç şikayet taşıyor
  ("benzer şikayet" senaryosu için), `emptyReportFixtures` boş durum için.
- **`fixtures/dashboard.ts`** — beş sayı brifing 5.2'den **birebir**, ikisi
  (`publishedListingCount`, `rejectedListingCount`) türetilmiş. Sayılar
  birbirini tutuyor ve bunun gerekçesi dosyanın başında yazılı: red oranı
  281/3.381 = 0,083, kategori dağılımının toplamı yayın sayısına eşit, oranların
  toplamı kayan noktada da tam 1. Pencere sabit (2026-06-17 → 2026-07-16), seri
  elle yazılmış — `new Date()` yok. **Bu ilişkileri bozmadan sayı değiştirme.**
- **`domain/labels.ts` enum etiketleri tamamlandı** — `AdminPermission` 33 iznin
  hepsini, dört "sınırlı" kademeyi parantezli kapsamıyla birlikte etiketliyor.
  Kapanış turunda üç sözlük daha eklendi: `USER_VERIFICATION_LABEL`,
  `BOOLEAN_HAS_LABEL`, `BOOLEAN_IS_LABEL` (sözleşme boşlukları bölümüne bak).

### Faz 1'de düzeltilen beş hata (Faz 2 sırasında bulundu)

Beşi de testler geçerken bozuktu; ikisi ancak ekran görüntüsüyle, ikisi ancak
yeni bir tüketici geldiğinde görüldü. Gerekçeleri "tuzaklar" bölümünde:

- `Button` — `loading` iken erişilebilir adı kayboluyordu (`visibility` → `opacity`).
- `NumberInput` / `CurrencyInput` — sayı biçimi kullanıcının makinesine göre
  değişiyordu (`locale="tr-TR"` sabitlendi).
- `Modal` — gövdesiz kullanımda başlıkla footer arasında boş bant kalıyordu
  (`body:empty` dolgusu sıfırlandı; ConfirmDialog'un ihtiyacı).
- `Select` — `value` koşullu spread ile geçiliyordu; Base UI kontrollülüğe **ilk
  render'daki** değere bakarak karar verdiği için `undefined` ile başlayan her
  çağıran Select'i önce kontrolsüz kuruyor, ilk seçimde kontrollüye çeviriyordu
  ve Base UI her seçimde console.error basıyordu. `value={value ?? null}`
  kontrollülüğü component'in ömrü boyunca sabitliyor. **Koşullu spread her yerde
  doğru değil:** `error`/`label`'da yokluk ile `undefined` aynı şeydir, `value`'da
  değildir — orada yokluk "kontrolsüz" demektir. Tetikleyen ilk tüketici
  ImageGallery'nin fotoğraf reddiydi; testler geçiyordu çünkü hiçbiri konsolu
  dinlemiyordu.
- `Toast` — `createPortal(...)` sonucunu doğrudan `return` ediyordu ve
  react-docgen "No suitable component definition found" deyip **dosyanın tamamını
  atlıyordu**: yedi prop'u belgeli olduğu hâlde ne Controls'ta ne AI
  manifest'inde görünüyordu. `@/` tuzağının aynısı, sebebi farklı. Portal ayrı
  bir component'e alındı. Story testiyle korunamaz (`__docgenInfo` yalnız
  `storybook build`/`dev` sırasında iliştiriliyor, vitest'te tanımsız) —
  koruyan şey aşağıdaki manifest sayım betiği.

### Prop JSDoc borcu — KAPANDI (144 → 0), ölçüm betiği duruyor

Faz 1'de sessizce delinen "Prop JSDoc'u zorunlu" kuralının borcu son turda
kapatıldı: **katalogdaki 55 component'in (26 primitive + 29 composite) prop'ları
belgeli.** En büyük kaldıraç beklendiği yerdeydi — `FieldMetaProps`'un dört
yorumu tek başına dokuz component'te 36 prop kapattı.

**Manifest'ten doğrulandı** (Faz 2 kapanışı, sözleşme turundan sonra yeniden
ölçüldü): 55 component, **391 prop, 0'ı açıklamasız**, react-docgen'in atladığı
component yok. Üç yeni prop (`ChartCardProps.onRetry`, `DataTableProps.onRetry`,
`ModerationActionBarProps.decisionError`) belgeli doğdu — borç yeniden açılmadı.
Kanonik ölçüm aşağıdaki betiktir.

**Kural duruyor: yeni component eklerken boş bırakma.** Bu açıklamalar Storybook
Controls paneline ve `manifests/components.json`'a doğrudan akıyor; yazılmazsa o
kanal sessizce boşalır ve kimse fark etmez. Borç bir kez ödendi, ikinci kez
ödenmesin.

**Ölçüm betiği — regresyon için sakla, faz sonlarında çalıştır.** Kanonik ölçüm
manifest üzerinden yapılır, çünkü **miras alınan prop'ları da sayar**
(`FieldMetaProps`, native attribute'lar):

```bash
pnpm build-storybook   # sonra manifest'i say (proplar `reactDocgen.props` altında)
node -e "const m=JSON.parse(require('fs').readFileSync('./storybook-static/manifests/components.json','utf8'));
for (const c of Object.values(m.components)) { const p=Object.entries(c.reactDocgen?.props ?? {});
if (!p.length) continue; const e=p.filter(([,x])=>(x.description??'')==='').map(([k])=>k);
if (e.length) console.log(c.name.padEnd(16), (p.length-e.length)+'/'+p.length, e.join(', ')) }"
```

Manifest hiç üretilemiyorsa (`build-storybook` yasaklı bir turdaysan) kaba
statik sayım da sinyal verir: `component-props.ts`'te `export interface`
gövdelerinde JSDoc'suz üye ara. Son statik ölçüm: **554 bildirilen prop, 150'si
belgesiz — hepsi Faz 3'ün henüz yazılmamış ekran tipleri** (11 `*PageProps` +
`*FilterValues` + `*Data`, 134 prop) **ve component prop'u olmayan yardımcı
tipler** (`UiError`, `DateRange`, `NumberRange`, `ColumnDef`; 16 prop —
manifest'te prop olarak görünmezler ama `ColumnDef`'i elle yazan çağıranı
ilgilendirirler). **Faz 3 ekranları bu 134 prop'u yazarken belgelesin, borç
yeniden doğmasın.**

**Native attribute'lar da sayılıyor.** `Button`/`IconButton`'da `disabled` ve
`type`, ButtonHTMLAttributes'tan geliyor ama component imzasında varsayılanları
olduğu için react-docgen onları prop sayıyor — belgelenmezse Controls'ta boş
görünüyorlar. Belgelemek için interface'te yeniden bildir; tipi native'le
birebir aynı yaz (`disabled?: boolean | undefined`), yoksa
`exactOptionalPropertyTypes` TS2320 verir (bkz. `InputProps.required` sapması).

## Faz 3'e girmeden çözülmesi gerekenler — sözleşme boşlukları

Faz 2'nin son 15 component'i bunları **raporladı, uydurmadı**: hiçbiri
`component-props.ts`/`domain.ts`/`labels.ts`'e dokunmadı; boşluğu görünür bir
kararla doldurup gerekçesini JSDoc'a yazdı. Hiçbiri Faz 2'yi bloke etmedi —
hepsi Faz 3'ü bloke edebilir, çünkü ekranlar bu prop'ları arayacak.

**Faz 2 kapanışında 11 ekranı bloke edenler kapatıldı** (aşağıda "KAPANDI" diye
işaretli). Kalanlar bilerek açık: ekranlar yazılırken karara bağlanacak,
şimdiden uydurulmayacak.

### `domain/labels.ts`

- **`USER_VERIFICATION_LABEL` — KAPANDI.** `{ true: 'Doğrulanmış', false:
'Doğrulanmamış' }` eklendi; UserSummaryCard ile SellerPanel'in dört değerli
  `SELLER_VERIFICATION_STATUS_LABEL`'dan kurduğu köprü kaldırıldı. Söz verildiği
  gibi yalnız iki fonksiyonun **gövdesi** değişti, çağrı yerleri durdu. Anahtar
  `` `${boolean}` ``: nesne anahtarı dizedir, indeksleme `sözlük[String(x)]`.
- **Boolean değer sözlükleri — KAPANDI.** `BOOLEAN_HAS_LABEL` ("Var"/"Yok") ve
  `BOOLEAN_IS_LABEL` ("Evet"/"Hayır") eklendi; ListingFacts'in iki yerel
  yardımcısı artık onlardan okuyor. **İkisi ayrı kalmalı:** Türkçede bir
  niteliğin _varlığı_ ile bir önermenin _doğruluğu_ aynı kelimeyle söylenmez —
  balkon "Var"dır, eşyalı olmak "Evet"tir. İngilizcedeki tek "Yes/No" bu ayrımı
  gizler; kaçırılırsa ilan detayında "Asansör: Evet" yazar.
- **Metrik alan etiketleri — KAPANDI: `LISTING_METRIC_LABEL` eklendi**, sahibi
  `ListingReviewPanel`'in metrik bloğu. Faz 2 teşhisi: `LISTING_FIELD_LABEL` yalnız "Metrikler" diyordu;
  `viewCount`/`favoriteCount`/`messageCount`/`reportCount` etiketsiz. Brifing 2.5
  metrikleri gösterilecek veri sayıyor ama 3.4'te **sahibi bir composite yok** —
  ListingFacts bilerek almadı (işi "kategoriye göre alanları göstermek"). Sahibi
  ekran fazında kararlaştırılmalı.
- **`LOCATION_FIELD_LABEL` yok** — şimdilik kural ihlali değil: `Location`'ın
  alanları düz string/number, ortada enum yok ve tek tüketici LocationPanel. Altı
  dize component içinde, JSDoc'ta belirtilmiş. ListingFacts veya AttributeEditor
  aynı adlara ihtiyaç duyarsa taşınmalı; `USER_VERIFICATION_LABEL` köprüsüyle
  aynı desen.

### `types/component-props.ts`

- **`AsyncState` `partialSuccess` + `unauthorized` — KAPANDI.** İkisi de
  brifing 3.5'in zorunlu story'si. **Neden ayrı durumlar:** her biri farklı bir
  şey yaptırır — `empty` filtreyi gevşetmeyi, `error` tekrar denemeyi,
  `unauthorized` yetki istemeyi; üçünü "veri yok"a indirmek yanlış eylemi
  önerir. `unauthorized`'ın `retryable`'ı tip düzeyinde `false`'a sabitlendi
  (403'ü tekrar denemek aynı 403'ü verir). `partialSuccess.data` bilerek
  `Partial<T>`: gelmeyen alan **yok**, boş değil — boş dizi koymak `empty` ile
  `error`'ı karıştırırdı ve `ChartCardProps.empty` tam da o farkı ayırmak için
  var. `errors` `data` ile aynı anahtar uzayını (`keyof T`) kullanıyor: düşen
  grafiği doğru ChartCard'a yönlendirmek düz bir `UiError[]` ile yapılamazdı.
- **Revizyon çakışması — KAPANDI.** `ModerationDecisionError` eklendi;
  `ModerationActionBarProps.decisionError` ve
  `ListingReviewPanelProps.decisionError` taşıyor. **`AsyncState`'in üyesi
  değil ve olmamalı:** `AsyncState` "veri geldi mi", bu "gönderdiğim karar
  uygulandı mı" sorusunu cevaplıyor — ilan sorunsuz yüklüyken
  (`status: 'success'`) karar reddedilebilir; aynı eksende olsalardı reddedilen
  karar ekranda duran ilanı hata bloğuna çevirirdi. `revisionConflict` ayrı bir
  `kind`, `failed`'in alt hâli değil: tekrar denemek **doğru değil** — aynı
  damga aynı çakışmayı üretir, damgayı yenilemek ise görülmemiş içeriği
  onaylamak olur. Doğru eylem yeniden yükleyip yeniden bakmak. Taslak (gerekçe +
  not) korunur.
- **`onRetry` kanalı — KAPANDI, ikisi birlikte.** `ChartCardProps.onRetry` ve
  `DataTableProps.onRetry` eklendi. **Kural değişmedi:** `retryable: true` tek
  başına butonu çıkarmaz, `onRetry` de bağlanmalı — hatanın tekrar denenebilir
  _olduğunu bilmek_, tekrar denemeyi _yapabilmek_ değil; iki kapı birden
  açılmalı. Ölçen story'ler: `ErrorCanBeRetried` (ikisinde de),
  `NonRetryableErrorIgnoresHandler`, `ErrorHasNoRetryButton`.
  DataTable bu sırada hata bloğunu elle çizmeyi bıraktı ve `ErrorState`'e
  geçti: kopya markup `role="alert"`, butonu ve odak halkasını ikinci kez
  üretmek zorunda kalacaktı, üstelik ham renk taşıyordu
  (`style={{ color: 'var(--color-text-muted)' }}`).
- **`ChartCardProps.empty` yalnız bayrak** — boş durumun metni ve eylemi
  dışarıdan verilemiyor, kart brifing 2.2'nin genel metnini gömmek zorunda kaldı.
  Filtre sonucu boşluğunda "filtreleri temizle" gerekirse
  `DataTableProps.emptyState` ile simetrik bir `emptyState?: ReactNode` lazım.
- **`RolePermissionMatrixProps.baseline` — KAPANDI: eklendi** (varsayılan
  `ROLE_PERMISSIONS`; `SettingsPage` kayıtlı hâli veriyor). Faz 2'nin teşhisi
  aynen doğruydu: `diff` varyantı "değişen hücreler" göstermek zorunda ama
  sözleşme **neye göre** değiştiğini söylemiyordu. Şimdilik
  taban `ROLE_PERMISSIONS` varsayıldı (JSDoc'ta ve story'lerde açıkça yazılı) ve
  bu varsayım yalnızca kayıtlı izinler domain sabitiyle aynı kaldığı sürece doğru:
  superAdmin bir izni değiştirip **kaydettiği an** backend'in gerçeği sabitten
  ayrılır ve matris o tarihten sonra her açılışta "değişmiş" hücreler göstermeye
  başlar — diff sessizce yalan söyler. Backend gelince kesinlikle olacak.
  `baseline?: Record<AdminRole, readonly AdminPermission[]>`: verilirse ondan,
  verilmezse `ROLE_PERMISSIONS`'tan okumak geriye dönük uyumlu bir düzeltme.
- **`StatCardProps.sparkline` — KAPANDI: eklenmedi, JSDoc düzeltildi.** (Aşağıdaki
  Faz 2 gerekçesi tarih olarak duruyor.) `variant` JSDoc'u `trend` için "mini bir
  eğri için yer açar" diyordu ama eğrinin verisini taşıyan alan yok. StatCard yer
  **ayırmıyor**: veri kanalı olmayan bir şey için boşluk ayırmak her kartta kalıcı
  bir delik demek. `TimeSeriesPoint` domain'de zaten var ve `fixtures/dashboard.ts`
  iki seriyi (`dailyNewListings`, `dailyModerationCount`) tam o biçimde veriyor —
  **veri hazır, taşıyıcı yok.** Alternatif: JSDoc'tan o cümleyi çıkarıp eğriyi
  ChartCard'a bırakmak. İkisi aynı ekranda; karar dashboard yazılırken netleşir.
- **`TopBarProps`'ta bildirim kanalı yok.** Brifing 3.4 TopBar'ı "global arama,
  profil ve **bildirim**" diye tanımlıyor; sayaç okunabiliyor ama listeye gitmenin
  hiçbir yolu yok. Gösterge olarak bırakıldı — basınca hiçbir şey yapmayan zil,
  kapalı zilden kötü. `onNotificationsClick` (veya `notificationsHref`) eklenirse
  değişecek tek yer: göstergeyi saran `<span role="status">` bir `IconButton`'a
  döner, rozet ve gizli metin aynen kalır.
- **`PageHeaderProps.secondaryActions` / `BreadcrumbItem.label` — KAPANDI.**
  İki prop JSDoc'u gerçekleştirilemez şey vaat ediyordu ("'…' menüsüne
  toplanır", "dar ekranda kısalır") ve component'in kendi JSDoc'u zaten
  **tersini** yazıyordu — sözleşme kendi içinde çelişiyordu. Gerçek kazandı:
  eylemler taşarsa **sarar**, kırıntı **sarar**. Gerekçeler prop JSDoc'larında.
  Değişen tek şey metin; davranış Faz 2'den beri aynı. Menü gerçekten
  isteniyorsa iki şey birden gerekir — prop `PageHeaderAction[]` gibi
  **sayılabilir** bir sözleşmeye dönmeli _ve_ bir DropdownMenu primitive'i
  eklenmeli (repoda Select/MultiSelect var, menü yok); biri olmadan öteki işe
  yaramaz.
- **`UserSummaryCardProps` yaptırım kaydını göremiyordu — KAPANDI:
  `activeSanction?: UserSanction` eklendi ve varyanta göre alan açıyor.** Faz 2
  teşhisi: yalnız `user: UserAccount` alıyordu, `status` yaptırımın **olduğunu** söylüyor ama
  `UserSanction` (gerekçe, `startsAt`, `endsAt`, `revokedAt`) sözleşmede yok.
  Brifing 2.6 "aktif yaptırım"ı gösterilecek veri sayıyor ve `fixtures/users.ts`
  `activeSuspensionSanction`'ı `endsAt` ile yazdı — "askı 29 Tem'de bitiyor"
  yaptırım kararı verirken tam olarak bakılan bilgi. Kart bugün yaptırımın
  **tipini** durumdan türetiyor, "neden" ve "ne zamana kadar"ı susarak geçiyor
  (uydurmaktansa doğrusu bu). Önerilen: `activeSanction?: UserSanction`.
- **`SellerPanelProps`: `activeListingCount?` ve `sanctions?` — KAPANDI, ikisi de
  eklendi ve bağlandı.** Faz 2 teşhisi: panel
  `user.activeListingCount`'u okumuyor (süzülmüş prop ile hesabın toplamı yan yana
  çelişkili çıkardı), dolayısıyla "yayında kaç ilanı var" — brifing 2.6'nın görünen
  verisi — bu panelde cevapsız; `listingCount`/`openReportCount` ile aynı bağlamdan
  gelen bir prop tutarlı olur. `risk` varyantı da brifing 3.4'ün istediği "yaptırım
  geçmişi"ni gösteremiyor: `UserStatus`'ten yalnız **yürürlükteki** yaptırımın tipi
  türetilebiliyor, gerekçe ve kaldırılmış geçmiş yaptırımlar görünmüyor.
  `allUserSanctionFixtures` hazır bekliyor.
- **`ReportCardProps`: üç boşluk — KAPANDI, dört prop eklendi ve bağlandı**
  (`now`, `reporter`, `assignedAdmin`, `relatedReportCount`). **Dikkat: aşağıda
  önerilen `AdminUser` tipi YOK** — admin de `UserAccount`'tur. Faz 2 teşhisi: (1) `now?: ISODateTime` — `variant` JSDoc'u
  "queue: şiddet ve **bekleme süresi** öne çıkar" diyor ama yaş hesabı "şimdi"yi
  gerektiriyor ve component saati kendi okuyamaz (göreli zaman tuzağı); kart şu an
  açılış anını mutlak tarih olarak gösteriyor. (2) **Ad çözümleme** — brifing 2.8
  "şikayet eden kullanıcı" ve "atanan admin" göstermeyi şart koşuyor ama sözleşme
  yalnız `reporterUserId`/`assignedAdminId` (UUID) veriyor ve kart veri çekemez;
  ham kimlik basılıyor. İsim isteniyorsa `reporter?: UserAccount` +
  `assignedAdmin?: AdminUser`. (3) `relatedReportCount?: number` — brifing 2.8'in
  "benzer şikayet sayısı" verisi sözleşmede hiç yok; `kadikoyApartmentReports`'un
  üç şikayeti bunu kart üzerinde gösteremiyor, yalnız yan yana üç kart olarak
  (`SameListingReports`) görünüyor.
- **`ListingFactsProps.headingLevel` — KAPANDI: gerekmiyor, varsayım doğrulandı.**
  Tek tüketici (`ListingReviewPanel`) bölümlerini `<h2>` ile açıyor, sayfanın
  `<h1>`'i PageHeader'ın (Faz 4): zincir h1 → h2 → h3, `heading-order` temiz.
  Prop eklenmedi — tüketicisi olmayan kanal açmak `sparkline`'da reddedilen
  hatanın aynısı olurdu. Başka bir yuvalama gerekirse geriye dönük uyumlu bir ek.

### `types/domain.ts` (dikkat: fiilen FastAPI'nin şartnamesi)

- **Kategori → alt kategori / işlem türü eşlemesi — KAPANDI.**
  `domain/categoryTree.ts` yazıldı: `CATEGORY_SUB_CATEGORIES` ve
  `CATEGORY_TRANSACTION_TYPES`. Bilgi enum **adında** gizliydi
  (`ResidentialSubCategory` konutun altındadır) — insan okur, kod okuyamazdı.
  Değerler `Object.values(Enum)` ile **türetiliyor**, elle yazılmıyor: elle
  yazılmış liste enum'a yeni üye eklendiğinde sessizce eksik kalırdı. (Altısı da
  string enum, yani ters eşleme yok; `Object.values` yalnız değerleri verir. Sıra
  enum'un bildirim sırası, yani brifingin sırası.)
  **Dikkat:** alt enum'ların değerleri çakışıyor (`ResidentialTransactionType.Sale`
  ve `LandTransactionType.Sale` ikisi de `'satilik'`) — bir `'satilik'`
  değerine bakıp kategorisini çıkaramazsın, cevabı yanındaki `category` verir.
  AttributeEditor hâlâ kapsamı okunur rozet olarak gösteriyor; eşleme geldiğine
  göre MultiSelect'e çevrilebilir — ama bu Faz 3'ün kararı, bu turda yapılmadı.
- **`CategoryAttributeDefinition.updatedBy` yok.** Brifing 2.7 "son güncelleyen
  admin ve tarih" istiyor ama tipte yalnız `createdAt`/`updatedAt` var; editör
  `readOnly`'de yalnız tarihi gösteriyor. Admin adı da istenecekse
  `updatedBy: UUID` (veya `AdminSummary`) eklenmeli — **backend sözleşmesi olduğu
  için bilerek dokunulmadı.**
- **"Kesin konumu görme" izni — KAPANDI: GEREKMİYOR.** Brifing 1.4'te "İlan
  görüntüleme" dört rolde de "Tam" ve `showExactLocation` brifing 1.1'de (satır 183) **son kullanıcının** sorusu diye tanımlı; ayrı izin matrisi kod üzerinden
  değiştirmek olurdu. Gösterim kapısı `ListingReviewPanelProps.revealExactLocation`
  ile sayfa katmanında. Faz 2 notu tarih olarak duruyor:
  `LocationPanelProps.revealExactLocation` bir **gösterim** kapısıdır, yetki kapısı
  değil — kimin açabileceğine sayfa katmanı karar veriyor (prop JSDoc'u ve
  story'nin `doNotUseWhen`'i böyle diyor). Ama `AdminPermission`'da karşılığı yok.
  Bu turda eklenen kademeli izinlerin mantığıyla `ListingViewExactLocation` gibi
  bir izin gerekebilir; `ListingReviewPanel`'e gelince karar verilmeli. Uydurulmadı.

### `vite.config.ts` — kapandı

- **`recharts` `optimizeDeps.include`'a eklendi** (Faz 2 kapanışı). ChartCard
  reponun ilk recharts tüketicisiydi ve bildirilmemişti; oradaki yorumun
  anlattığı sıcak-cache "Failed to fetch dynamically imported module" hatası bu
  bağımlılıkta da bekleniyordu. Kural aynen duruyor: **yeni bir Base UI alt yolu
  ya da story'lerin dolaylı yüklediği yeni bir paket eklersen bu listeye de ekle.**

### Boşluk değil, kasıt — karıştırma

- **`SidebarNav` yetkiye göre süzmüyor.** `NavigationItem.requiredPermission` var
  ama `SidebarNavProps`'ta kullanıcının izin listesi yok. Bu **eksik değil**,
  "yetki kontrolü component'in işi değil" kuralının doğal sonucu: alan, süzmeyi
  yapan sayfa katmanına bırakılmış bir _bildirimdir_ ve menü tanımını tek yerde
  tutar. Uydurma prop (`permissions`) eklenmedi; boşluğu component JSDoc'u ve
  `doNotUseWhen` açıkça yazıyor, `RequiredPermissionIsNotAGate` regresyon testi
  olarak duruyor (yetkisiz satır `items`'a konursa component onu olduğu gibi
  gösterir) ve süzmeyi örnekleyen `yetkiyeGöreSüz` story dosyasında,
  `ROLE_PERMISSIONS`'tan okuyor. **Faz 3'te AppShell/sayfa katmanı bu süzgeci
  gerçek yerine taşımalı; oraya kadar sözleşme değişmesin.**
- **Panellerde `loading`/`error` kanalı yok** (PromotionFlagsPanel, ReportCard,
  SellerPanel) ve bu yüzden Loading/Error story'si yazılmadı; gerekçe story
  dosyalarında yorumlu. Panel veri çekmiyor: ilan detayının yükleme/hata durumu
  **sayfanın işi** (bkz. açık `AsyncState` maddesi). Panelin kendi iskeletini
  uydurması, veri gelmediğinde "promosyon yok" demekle aynı yalanı söylerdi.
- **`AppShellProps.sidebarMode` bir düzen bildirimidir, düğme anahtarı değil.**
  JSDoc'u "collapsible: daralt/genişlet düğmesi görünür" diyor ama o düğmeyi
  AppShell render etmiyor, edemez de — sözleşmesinde `onCollapsedChange` yok.
  Düğme SidebarNav'ındır (`onCollapsedChange` verilmezse hiç görünmüyor, ki bu
  `SidebarNavProps`'un JSDoc'unda "AppShell'in fixed hâli" diye yazılı). Zinciri
  sayfa katmanı kurar. İki JSDoc tutarlı; ekleme gerekmiyor.
- **`CategoryTree`'de sayaç/rozet okuması.** `variant` JSDoc'u "panel: … sayaçlar
  ve pasiflik rozeti görünür" diyor; düz okunursa sayaçlar yalnız panel'de
  görünürdü. Ama `CategoryTreeNode.count`'un kendi JSDoc'u "verilmezse sayaç
  gösterilmez" diyor ve varyanttan hiç bahsetmiyor. Kurulan tutarlı okuma: **sayaç
  verilen her varyantta görünür** (count sözleşmesi), **pasiflik rozeti yalnız
  panel'de** (variant sözleşmesi) — dar varyantlarda ikon + gizli metin. Panel'in
  tarifi hâlâ doğru, sadece münhasır değil. Başka bir şey kastedildiyse tek
  satırlık netleştirme yeter.
- **`SearchInput` kontrollü kullanımda kendini temizlemez.** `onClear` yalnız haber
  verir; değerin sahibi çağırandır. Bağlanmazsa temizleme düğmesi görünür ama
  hiçbir şey yapmaz — sessiz bozukluk. TopBar
  `onClear={() => onSearchChange('')}` bağlıyor, `SearchActive` ölçüyor. Aynısını
  her yeni tüketici yapmalı.
- **`mobileOpen` zorunlu değil ama `onMobileOpenChange` olmadan anlamsız.**
  Çekmeceyi açıp kapatamamak klavye tuzağı olurdu, bu yüzden SidebarNav handler
  yoksa çekmeceyi **hiç render etmiyor**; aynı asimetri `collapsed`/
  `onCollapsedChange` ikilisinde de var. Sözleşme bunu tip düzeyinde ifade
  edemiyor (discriminated union gerekirdi); davranış JSDoc'ta ve
  `DrawerNeedsAHandler` ölçüyor.

## Faz 3'ün açtığı kayıt: düzeltilen component kusurları

Hepsi **Faz 1/2'de yazılmış**, hepsi testler geçerken bozuktu, hepsini ekranlar
yazılırken bir tüketici buldu. Sözleşmeyi bir kez daha doğrulayan şey bu: **kusuru
gösteren şey ikinci tüketicidir.**

- **`UserSummaryCard` `adminRole`'ü sızdırıyordu** — rozet **varyanttan bağımsız**
  basılıyordu, yani `detailed` (destek'in gördüğü yüz) admin rolünü gösteriyordu.
  Kartın kendi `variant` JSDoc'u ve `AdminPermission.UserViewProfile` onu açıkça
  gizli sayarken. `lastLoginAt` doğru kapılıydı, bu değildi — sızıntı tam olarak
  "alanı listeye yazıp kapıyı kurmayı unutmak" biçimindeydi. Ölçen:
  `UserManagementPage`. Regresyon: `AdminRoleIsHiddenInLimitedView`.
- **`UserSummaryCard`'ın `security`'si `detailed`'ın üst kümesi DEĞİLDİ** — kart
  e-posta/telefon/ilan sayaçları/kayıt tarihini `detailed`'da çiziyor,
  `security`'de çizmiyordu: yani **moderatör ile süper admin kullanıcının
  e-postasını göremiyor, destek görüyordu.** Yetki modelinin tersi. Kademe artık
  gerçekten kademeli: compact ⊂ detailed ⊂ security. Ölçen: `UserDetailPage`.
- **`RolePermissionMatrix`** — 320 pikselde sayfayı taşırıyordu (iki sebep,
  yukarıda); `diff` çubuğunun metni `baseline` eklendikten sonra yalan söylüyordu.
- **`Tabs.root`** — kolon izi bildirilmemişti; her `Tabs` tüketicisini etkiliyordu
  ve component'in kendi "sekmeler kaydırılır" sözünü deliyordu.
- **`FieldShell.description`** — Base UI `Field.Description` bir `<p>` basıyor ve
  tarayıcının `1em` (16 piksel) margin'iyle geliyordu; `root`'un `gap`'i
  `space[1]` (4 piksel), yani **dikey ritmi token değil tarayıcı belirliyordu,
  dört katı**. Dokuz component'in altyapısı olduğu için sızıntı dokuz yere
  gidiyordu. Reset tuzağının birebir tekrarı.
- **`FieldShell.root` / `FilterBar.rangeInputs`** — grid izi (yukarıda).
- **`DataTable`'ın `loading` + `selectable` dalı boş `<th>` basıyordu** →
  axe `empty-table-header`. Yüklü dal hücreyi `hideLabel`'lı Checkbox ile
  dolduruyor, yükleme dalı boş bırakıyordu; a11y kapısı `'error'` olduğu için
  seçilebilir bir tabloyu yüklerken gösteren her story düşüyordu.

### Hâlâ açık — ölçüldü, düzeltilmedi (dosya sahipliği / kapsam)

- **`ListingCard`: odak halkası kırpılıyor.** Faz 2 bunu "muhtemel bir hata,
  ekran görüntüsüyle doğrulanmalı" diye bırakmıştı — **doğrulandı**: `card`
  recipe'i `overflow: hidden` + `clickRegion` kabı kaplayan bir `<button>`;
  global `:focus-visible` outline'ı `outlineOffset: 0.125rem` ile dışarı taşıyor
  ve ata onu yutuyor. `ApprovalQueue`'da ölçüldü.
- **`ListingCard.actions` tıklanabilir `<button>`'ın İÇİNDE render ediliyor** →
  iç içe etkileşimli element (geçersiz HTML + axe `nested-interactive`). JSDoc'u
  "actions'a tıklamak onClick'i tetiklemez" diyor ama oraya buton koymak kartı
  kırıyor. `ApprovalQueue` slot'a yalnız rozet koydu, butonları kartın kardeşi
  yaptı.
- **`ListingCard` 320 pikselde `detailed`**: `media` 176 piksel sabit, `body`'nin
  `clientWidth`'i **32**, `scrollWidth`'i 277 — içerik kartın `overflow: hidden`'ıyla
  kırpılıyor. Kırpıldığı için köke taşma olarak yansımıyor, yani **hiçbir test
  görmüyor**.
- **`UserSummaryCard` `<button>` olurken içine akış içeriği koyuyor** (`<dl>`,
  `<p>`): buton içine akış içeriği geçersiz HTML. AGENTS'ın "kart `<button>`
  olabiliyorsa bütün çocukları phrasing content" maddesi StatCard/ReportCard/
  ListingCard'ı sayıyor ama **UserSummaryCard'ı atlamış** — ve reset maddesi onu
  `<dl>` kullanıcısı diye anıyor: iki kural bu dosyada çarpışıyor.
- **`DataTable.mobileMode` viewport'a bakmıyor.** JSDoc'u "dar ekranda ne olacağı"
  diyor ama dal koşulsuz; `mobileMode="cards"` 1440'ta da kart çiziyor. Üç ekran
  bağımsız olarak buna çarptı ve ikisi çift render + medya sorgusuyla çözdü
  (çift DOM bedeli), `AuditLogPage` `scroll` seçtiği için kaçtı. Kalıcı çözüm
  `css.cards`'a medya sorgusu.
- **`DataTable.onRowClick` yalnız fare** — `<tr onClick>`, rol/tabIndex/tuş
  dinleyicisi yok. Satır açmayı ona bağlayan tablo klavyeye ölü olur; üç ekran da
  bunun yerine hücre içinde gerçek `<button>` kullandı.
- **`DataTable.rowLabel` yalnız `selectable` iken okunuyor** — seçimsiz tabloda
  ölü prop.
- **`RadioGroup`: `label` verilince her seçenek grubun adını devralıyor** — üç
  tema da "Kendi temam" diye okunuyor. Zincir: `FieldShell`→`Field.Root` bir
  `LabelableProvider` açıyor, `Field.Label` id'sini oraya yazıyor; ne `RadioGroup`
  ne `Radio` kendi labelable kapsamını açıyor (Base UI `Field.Item` bekliyor), o
  yüzden `useAriaLabelledBy`'nin `explicit ?? labelId ?? fallback`'i grubun
  id'sini sarmalayan `<label>`'ın önüne geçiriyor. **axe yakalamaz** — ad _eksik_
  değil, _yanlış_. `RadioGroup.stories.tsx`'te **hiç play testi yok** ve
  `SettingsPage` primitive'in ilk gerçek tüketicisi.
- **`InputProps` "mesajsız geçersiz"i ifade edemiyor**: `data-invalid` yalnız
  dolu bir `error`'dan doğuyor ve `error` aynı zamanda metni basıyor. Sonuç:
  **giriş hatasında alanlar kırmızı kenarlık almıyor** (`AuthScreen`). Gereken:
  `error`'dan bağımsız `invalid?: boolean`.
- **`EmptyState`/`ErrorState` başlığı `<p>` basıyor** — tam sayfa bir ekran
  (`AuthScreen`) onları kullanamıyor, çünkü sayfanın `<h1>`'i olmalı. Brifing
  2.11 ikisini de türetiyor. `ListingFactsProps.headingLevel` ile aynı aile;
  fark şu ki burada **gerçek bir tüketici** var.
- **`ErrorState`'in güvenli geri dönüş slotu yok** (brifing 2.1) — `AuditLogPage`
  bağlantıyı kendi çiziyor ve bu yüzden ekran Router context'i gerektiriyor.
- **`ImageGallery` → `BrokenImageShowsExplanation` kırılgan**: tam paralel yükte
  (66 dosya) düşüyor, tek başına 21/21 geçiyor. Kırık görselin `onerror`'ı ile
  `findByText` yarışıyor. Faz 3 öncesinden var, Faz 3 dokunmadı.
- **`date-fns` bağımlılığı `src/`'te hiç kullanılmıyor** ve `optimizeDeps`'te de
  yok. Ya benimsenmeli ya düşürülmeli.
- **`ColumnDef.hideable` ölü bildirim** — `DataTable` ona hiç bakmıyor.

## Karar bekleyenler — UYDURMA, SOR

**Chromatic** ücretsiz planla bu spesifikasyon **matematiksel olarak çalışmıyor**
ve her fazda kötüleşiyor: Faz 2'de 912 story → 5.472 snapshot/build idi; **Faz 3
sonunda ölçülen 1.257 story** × 3 tema × 2 viewport = **7.542 snapshot/build**,
kota **5.000/ay** — yani tek bir build aylık kotanın **bir buçuk katı**. Org repo'su gündeme
gelince tema×viewport matrisi daraltılmalı ya da ücretli plana geçilmeli.

**Backend** en sona bırakıldı — bu yüzden `src/types/domain.ts` fiilen FastAPI'nin
şartnamesidir. Oradaki tipleri değiştirirken bunu hatırla.

### Faz 3'ün raporladığı kanal boşlukları — brifing istiyor, sözleşme veremiyor

Ekranlar bunları **uydurmadı, raporladı** ve ilgili prop'un JSDoc'una dürüstçe
yazdı. Sözleşme değişikliği gerektiriyorlar; Faz 4'ün ilk işi bunlara karar
vermek olabilir. **En sivri olanlar üstte:**

- **`DashboardMetrics` brifing 2.2'nin ÜÇ verisini hiç taşımıyor**: "en uzun
  süredir bekleyen ilanlar", "son moderasyon işlemleri", "moderatör bazında işlem
  hacmi". İzin listesi değil, **veri kanalının kendisi** yok. Ayrıca
  `dailyModerationCount` ayrışmamış tek seri — brifingin istediği **onay/red
  ayrımı** çizilemiyor. `domain.ts` = FastAPI şartnamesi, dokunulmadı.
- **`ApprovalQueue` karar veremiyor**: `onApprove`/`onReject`/`onRequestChanges`
  yok. Brifing 2.4 "hızlı onay/red/düzeltme"yi eylem sayıyor. **Bunun sonucu
  olarak brifing 3.5'in zorunlu `Conflict` story'si bu ekranda MANTIKEN
  yazılamaz**: çakışma _gönderilen bir karara_ verilen cevaptır, bu ekran karar
  göndermiyor. İki tutarlı kapanış var — ya kuyruk karar vermez ve `Conflict`
  ondan düşer (`ListingReviewPanel`'de zaten zorunlu ve kanalı var), ya karar
  handler'ları **ve** `decisionError` birlikte eklenir. `decisionError`'ı tek
  başına eklemek gönderilmemiş bir kararın reddini göstermek olurdu.
- **`ReportManagementPageProps`'ta `availablePermissions` YOK** — oysa
  `ListingListPageProps`/`UserManagementPageProps`/`UserDetailPageProps`'ta var.
  Üstelik `onResolve`/`onDismiss`/`onEscalate` **zorunlu**, yani "bu kullanıcı
  çözemez" handler'ı vermeyerek bile söylenemiyor: `report:triageLimited` olan
  içerik denetçisi "Çöz" görüyor. Ekran yalnız **durum** kapısı kurabildi
  (`status ∈ {open, inReview}`). `domain/reportActions.ts` de yok
  (`moderationActions.ts`'in şikayet karşılığı).
- **`SettingsPageProps`'ta `state: AsyncState` yok** → brifing 3.5'in zorunlu
  `Loading` story'si yazılamıyor.
- **Ad çözümleme paketi yok**: `ReportManagementPage` `Paginated<ListingReport>`
  alıyor, kullanıcı paketi almıyor → `ReportCard`'ın Faz 3'te eklenen
  `reporter`/`assignedAdmin`/`listing` prop'larının **üçü de beslenemiyor**, kart
  UUID basıyor. Aynı sebeple `ReportFilterValues.assignedAdminId` için seçenek
  kaynağı yok. Çözüm: `ListingReviewData`/`UserDetailData` gibi bir paket.
- **`ReportManagementPageProps`'ta `now` yok** → `ReportCard.now` tam bu ekran
  için eklendi ama tüketicisi onu veremiyor. Ekran `2026-07-16`'yı **koda
  gömmeyi reddetti** (haklı: donmuş bir "bugün" her kartta kalıcı yanlış süre
  yazar; kartın belgelenmiş yedeği olan mutlak tarih daha doğru).
- **`UserDetailData` `UserSanction` taşımıyor** → `UserSummaryCardProps.activeSanction`
  beslenemiyor; brifing 2.6'nın "aktif yaptırım"ı kullanıcı detayında hâlâ
  cevapsız. `ListingReviewData` de taşımıyor → `SellerPanel`'in `risk` varyantına
  yaptırım geçmişi verilemiyor.
- **`CategoryAttributePageProps`'ta `validationErrors` besleyecek alan yok** —
  `AttributeEditor.validationErrors` var ama ekran veri çekmediği için kendi de
  üretemiyor; brifing 2.7'nin `validationError` durumu kurulamıyor. `publishPending`
  ve `conflict` de kanalsız.
- **`DashboardStatsProps.onRetry` alan bilmiyor** (`() => void`) →
  `ChartCardProps.onRetry`'nin "yalnız o alanın sorgusunu tazeler" sözü bu ekranda
  tutulamıyor: bir grafiğin retry'ı bütün dashboard'ı çeker.
- **`UserDetailData.listings` `Paginated` ama `onPageChange` yok** → ikinci sayfa
  istenemez.
- **Sıralama kanalı hiçbir liste ekranında yok** (`onSortChange`) → hiçbir kolon
  `sortable` verilmedi (ölü buton üretmemek için).
- **`UserManagementPage`/`UserDetailPage`'de `banPending`/`roleChangePending`/
  `roleChangeConflict` kanalı yok**; `onRoleChange`'de `expectedRevision` gibi bir
  damga da yok → son yazan kazanır ve ekran fark etmez.
- **`onSuspend`/`onBan` yaptırımın kendisini toplamıyor** (süre/gerekçe yok);
  `onResolve`/`onDismiss` çözüm notunu toplamıyor — oysa brifing 2.8 "çözüm
  notu"nu görünen veri sayıyor.
- **`AuthScreenProps.error` `string`**, diğer ekranlar `UiError` — tutarsız; sonuç
  olarak `fatalError`'da destek kodu gösterilemiyor (brifing 2.11 `ErrorState`
  türetiyor). Düzen varyantı (`Centered card` / `Split brand panel`) için de prop
  yok; ekran medya sorgusuyla çözdü (64rem) ve gerekçesini yazdı.
- **`ListingReviewPanel`**: benzer/mükerrer ilan önerileri, admin notları, revizyon
  **geçmişi** (yalnız tek adım `previousRevision` var), önceki/sonraki kuyruk
  ilanı, fotoğraf bazlı moderasyon (`onPhotoApprove`/`onPhotoReject`),
  `ImageGallery`'de `error` kanalı, `highlightedFields`i besleyen "maddi
  değişiklik" fonksiyonu — hiçbirinin kanalı yok. (`ListingFacts`'in `@example`'ı
  var olmayan bir `maddiDegisiklikler()` çağırıyor.)
- **`AuditLogPage`**: dışa aktarma kanalı yok; `AuditLogFilters`'ta aktör/eylem
  filtresi yok (`query` yaklaşık tutuyor).
- **`ListingListPage`**: il/ilçe/mahalle ve "inceleyen moderatör" filtrelerinin
  **seçenek kaynağı** yok; alt kategori, güncellenme tarihi aralığı, kayıtlı
  görünüm, kolon seçimi, `pageSize`, satır başına eylemler, `mutationPending`
  kanalsız.
- **`fixtures/categories.ts` yok** → `CategoryAttributePage`, `CategoryTree` ve
  `AttributeEditor` üçü de story-yerel ağaç kuruyor. `fixtures/users.ts`'te
  **`revokedAt` dolu yaptırım kaydı yok** → `SellerPanel.sanctions`'ın merkezî
  sözü ("kaldırılmış yaptırım da sicildir") gerçek fixture'la ölçülemiyor.
  `allUserSanctionFixtures` bir satıcının sicili olarak kullanılamıyor: iki
  yaptırım **iki ayrı hesaba** ait.
- **`FilterValue → tipli filtre` daraltması** (`nesneMi`/`tarihAraligiOku`) her
  liste ekranında yeniden yazıldı — FilterBar iç yardımcılarını export etmiyor.
  Paylaşılan util adayı.

## Git

Kullanıcı **tüm git işlemlerini kendi yapar.** Commit atma, push etme, remote ekleme.
İş bitince faz faz `git add` komutlarını ve commit mesajlarını **metin olarak ver**.
