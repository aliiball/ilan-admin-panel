# ADIM 1 — ÖNCE DOMAIN MODELİ

## 1.1. Listing tanımı, kategori ağacı ve alanlar

### Listing tanımı

`Listing`, bir gayrimenkulün satılık, kiralık, günlük kiralık veya devren sunulmasını temsil eden; kategoriye bağlı öznitelikleri, fiyatı, konumu, medya varlıklarını, ilan sahibini, yayın durumunu, promosyonlarını, moderasyon sonuçlarını ve denetim geçmişini birlikte taşıyan ana domain varlığıdır.

Bir ilan yalnızca ekranda gösterilecek içerikten ibaret değildir. Admin panel açısından ilan şu beş katmanı birlikte kapsar:

1. Kamuya gösterilen ilan içeriği.
2. Kategoriye özel gayrimenkul öznitelikleri.
3. İlan sahibi ve iletişim bilgileri.
4. Moderasyon, rapor ve yayın yaşam döngüsü.
5. Admin görünürlüğüne açık promosyon, metrik ve audit bilgileri.

Kategoriye özel alanlar tek bir gevşek nesnede tutulmamalıdır. `Listing`, `category` alanıyla ayrıştırılan bir discriminated union olmalıdır. Böylece örneğin bir `arsa` ilanında `grossSquareMeters`, bir `konut` ilanında `parcel` kullanılması derleme aşamasında engellenir.

### Kategori ağacı

| Ana kategori   | İşlem türleri                    | Alt kategoriler                                                                |
| -------------- | -------------------------------- | ------------------------------------------------------------------------------ |
| Konut          | Satılık, Kiralık, Günlük Kiralık | Daire, Rezidans, Müstakil Ev, Villa, Yazlık, Çiftlik Evi, Prefabrik            |
| Arsa           | Satılık, Kiralık                 | Konut İmarlı, Ticari İmarlı, Sanayi İmarlı, Turizm İmarlı, Tarla, Bağ ve Bahçe |
| İşyeri         | Satılık, Kiralık, Devren         | Dükkan ve Mağaza, Ofis, Plaza, Depo ve Antrepo, Fabrika, Atölye                |
| Bina           | Satılık, Kiralık                 | Komple Bina                                                                    |
| Devremülk      | Satılık, Kiralık                 | Devremülk                                                                      |
| Turistik Tesis | Satılık, Kiralık, Devren         | Otel, Butik Otel, Apart Otel, Pansiyon, Motel, Tatil Köyü, Kamp Yeri           |

### Ortak Listing alanları

| Türkçe alan          | TypeScript alanı  | Tip                  | Açıklama                                                                   |
| -------------------- | ----------------- | -------------------- | -------------------------------------------------------------------------- |
| Dahili kimlik        | `id`              | `UUID`               | Sistemdeki değişmez benzersiz kimlik                                       |
| İlan No              | `listingNo`       | `string`             | Admin ve son kullanıcı tarafında gösterilen ilan numarası                  |
| Başlık               | `title`           | `string`             | İlan başlığı                                                               |
| Açıklama             | `description`     | `string`             | Zengin metinden arındırılmış veya güvenli biçimde işlenmiş ilan açıklaması |
| Kategori             | `category`        | `ListingCategory`    | Discriminated union ayrıştırıcısı                                          |
| Alt kategori         | `subCategory`     | `ListingSubCategory` | Kategoriye bağlı alt tür                                                   |
| İşlem türü           | `transactionType` | Kategoriye özel enum | Satılık, kiralık, günlük kiralık veya devren                               |
| Fiyat                | `price`           | `Money`              | Tutar, para birimi, fiyat periyodu ve pazarlık durumu                      |
| Konum                | `location`        | `Location`           | İl, ilçe, mahalle ve opsiyonel koordinat                                   |
| Fotoğraflar          | `photos`          | `ListingPhoto[]`     | Kapak görseli, sıralama ve görsel moderasyonu                              |
| İlan tarihi          | `listingDate`     | `ISODateTime`        | İlanın ilk oluşturulduğu veya sisteme alındığı tarih                       |
| Oluşturulma tarihi   | `createdAt`       | `ISODateTime`        | Dahili kayıt oluşturma zamanı                                              |
| Güncellenme tarihi   | `updatedAt`       | `ISODateTime`        | Son içerik veya durum değişikliği                                          |
| Gönderim tarihi      | `submittedAt`     | `ISODateTime?`       | Moderasyona son gönderim zamanı                                            |
| Yayın tarihi         | `publishedAt`     | `ISODateTime?`       | Son yayın başlangıcı                                                       |
| Bitiş tarihi         | `expiresAt`       | `ISODateTime?`       | Yayının otomatik sona ereceği zaman                                        |
| Kimden               | `seller.type`     | `SellerType`         | Sahibinden, emlak ofisi veya inşaat firması                                |
| İlan sahibi          | `seller`          | `SellerSummary`      | İlan veren kişi veya kurum özeti                                           |
| Kullanıcı kimliği    | `ownerUserId`     | `UUID`               | İlanı yöneten kullanıcı hesabı                                             |
| İletişim             | `contact`         | `ListingContact`     | Telefon, e-posta ve iletişim tercihleri                                    |
| Durum                | `status`          | `ListingStatus`      | İlan durum makinesindeki aktif durum                                       |
| Promosyon işaretleri | `promotionFlags`  | `PromotionFlags`     | Öne çıkan, acil, vitrin ve benzeri görünürlükler                           |
| Promosyon kayıtları  | `promotions`      | `ListingPromotion[]` | Promosyonların başlangıç, bitiş ve aktivasyon geçmişi                      |
| Moderasyon özeti     | `moderation`      | `ModerationSummary`  | İnceleyen kişi, red gerekçeleri ve otomatik kontroller                     |
| Metrikler            | `metrics`         | `ListingMetrics`     | Görüntülenme, favori ve rapor sayıları                                     |
| Kaynak               | `source`          | `ListingSource`      | Web, mobil, API veya admin import                                          |
| Revizyon             | `revision`        | `number`             | Her maddi içerik değişikliğinde artan sürüm                                |
| Etiketler            | `tags`            | `string[]`           | Admin içi sınıflandırma ve operasyon etiketleri                            |

### Konut alanları

| Alan             | TypeScript alanı    | Kural                                                                     |
| ---------------- | ------------------- | ------------------------------------------------------------------------- |
| Brüt m²          | `grossSquareMeters` | Pozitif sayı                                                              |
| Net m²           | `netSquareMeters`   | Pozitif sayı, brüt m² değerinden büyük olamaz                             |
| Oda sayısı       | `roomCount`         | `1+0` ile `5+1+` ve genişletilmiş seçenekler                              |
| Bina yaşı        | `buildingAge`       | `0`, `1-5`, `6-10`, `11-15`, `16-20`, `21+`                               |
| Bulunduğu kat    | `floorLocation`     | Bodrum, zemin, kat aralığı, çatı veya müstakil                            |
| Kat sayısı       | `floorCount`        | Pozitif tam sayı                                                          |
| Isıtma tipi      | `heatingType`       | Doğalgaz kombi, merkezi, kat kaloriferi, yerden, klima, soba ve ek tipler |
| Banyo sayısı     | `bathroomCount`     | 0–10                                                                      |
| Balkon           | `hasBalcony`        | Boolean                                                                   |
| Asansör          | `hasElevator`       | Boolean                                                                   |
| Otopark          | `parkingType`       | Yok, açık, kapalı, açık ve kapalı                                         |
| Eşyalı           | `furnished`         | Boolean                                                                   |
| Kullanım durumu  | `occupancyStatus`   | Boş, kiracı, mülk sahibi                                                  |
| Site içerisinde  | `inComplex`         | Boolean                                                                   |
| Site adı         | `complexName`       | `inComplex=true` olduğunda kullanılabilir                                 |
| Aidat            | `monthlyFee`        | Aylık `Money`                                                             |
| Krediye uygunluk | `loanEligibility`   | Uygun, uygun değil, bilinmiyor                                            |
| Tapu durumu      | `titleDeedStatus`   | Kat mülkiyeti, kat irtifakı, hisseli, arsa tapulu                         |
| Takas            | `swapAccepted`      | Boolean                                                                   |

### Arsa alanları

| Alan        | TypeScript alanı          | Kural                                                       |
| ----------- | ------------------------- | ----------------------------------------------------------- |
| m²          | `squareMeters`            | Pozitif sayı                                                |
| İmar durumu | `zoningStatus`            | Konut, ticari, sanayi, turizm, tarla, bağ ve bahçe, plansız |
| Ada         | `block`                   | Opsiyonel metin                                             |
| Parsel      | `parcel`                  | Opsiyonel metin                                             |
| Pafta       | `mapSheet`                | Opsiyonel metin                                             |
| KAKS        | `floorAreaRatio`          | Opsiyonel pozitif ondalık sayı                              |
| Gabari      | `maxBuildingHeightMeters` | Opsiyonel metre değeri                                      |
| m² fiyatı   | `pricePerSquareMeter`     | Toplam fiyat ve m² üzerinden tutarlı olmalı                 |
| Yol cephesi | `roadFrontageMeters`      | Opsiyonel metre değeri                                      |
| Altyapı     | `infrastructure`          | Elektrik, su, doğalgaz, kanalizasyon, yol                   |

### İşyeri alanları

| Alan            | TypeScript alanı    | Kural                                                  |
| --------------- | ------------------- | ------------------------------------------------------ |
| m²              | `squareMeters`      | Pozitif sayı                                           |
| Oda sayısı      | `roomCount`         | Sayısal veya açık plan                                 |
| Kat sayısı      | `floorCount`        | Pozitif tam sayı                                       |
| Bulunduğu kat   | `floorLocation`     | Opsiyonel                                              |
| Isıtma tipi     | `heatingType`       | `HeatingType`                                          |
| Depozito        | `deposit`           | Kiralık ilanlarda opsiyonel `Money`                    |
| Yapının durumu  | `buildingCondition` | Sıfır, ikinci el, yapım aşamasında, renovasyon gerekli |
| Asansör         | `hasElevator`       | Boolean                                                |
| Otopark         | `parkingType`       | `ParkingType`                                          |
| Eşyalı          | `furnished`         | Boolean                                                |
| Aidat           | `monthlyFee`        | Opsiyonel aylık `Money`                                |
| Devir bedeli    | `transferFee`       | Devren ilanlarda opsiyonel `Money`                     |
| Kullanım durumu | `occupancyStatus`   | Boş, kiracı, mülk sahibi                               |

### Bina alanları

| Alan                  | TypeScript alanı       | Kural                    |
| --------------------- | ---------------------- | ------------------------ |
| Toplam m²             | `totalSquareMeters`    | Pozitif sayı             |
| Net m²                | `netSquareMeters`      | Opsiyonel                |
| Bina yaşı             | `buildingAge`          | `BuildingAge`            |
| Kat sayısı            | `floorCount`           | Pozitif tam sayı         |
| Bağımsız bölüm sayısı | `independentUnitCount` | Pozitif tam sayı         |
| Yapı kullanım izni    | `hasOccupancyPermit`   | Boolean                  |
| Asansör               | `hasElevator`          | Boolean                  |
| Otopark               | `parkingType`          | `ParkingType`            |
| Isıtma tipi           | `heatingType`          | `HeatingType`            |
| Kullanım tipi         | `usageType`            | Konut, ticari veya karma |
| Aylık kira getirisi   | `monthlyRentalIncome`  | Opsiyonel aylık `Money`  |
| Tapu durumu           | `titleDeedStatus`      | `TitleDeedStatus`        |
| Takas                 | `swapAccepted`         | Boolean                  |

### Devremülk alanları

| Alan             | TypeScript alanı       | Kural                                 |
| ---------------- | ---------------------- | ------------------------------------- |
| Tesis adı        | `facilityName`         | Zorunlu                               |
| m²               | `squareMeters`         | Pozitif sayı                          |
| Oda sayısı       | `roomCount`            | `RoomCount`                           |
| Kullanım dönemi  | `usagePeriod`          | Açık tarih veya sezon açıklaması      |
| Kullanım günü    | `usageDays`            | Pozitif tam sayı                      |
| Sezon            | `season`               | Yaz, kış, ilkbahar, sonbahar, tüm yıl |
| Yıllık aidat     | `annualMaintenanceFee` | Yıllık `Money`                        |
| Tapu durumu      | `titleDeedStatus`      | `TitleDeedStatus`                     |
| Değişim programı | `exchangeProgram`      | Opsiyonel                             |
| Eşyalı           | `furnished`            | Boolean                               |

### Turistik tesis alanları

| Alan            | TypeScript alanı        | Kural                    |
| --------------- | ----------------------- | ------------------------ |
| Oda sayısı      | `roomCount`             | Pozitif tam sayı         |
| Yatak sayısı    | `bedCount`              | Pozitif tam sayı         |
| Yıldız sayısı   | `starRating`            | Opsiyonel 1–5            |
| Kat sayısı      | `floorCount`            | Pozitif tam sayı         |
| Kapalı alan     | `indoorSquareMeters`    | Pozitif sayı             |
| Açık alan       | `outdoorSquareMeters`   | Sıfır veya pozitif sayı  |
| Bina yaşı       | `buildingAge`           | `BuildingAge`            |
| İşletme ruhsatı | `hasOperatingLicense`   | Boolean                  |
| Alkol ruhsatı   | `hasAlcoholLicense`     | Boolean                  |
| Sahile uzaklık  | `distanceToBeachMeters` | Opsiyonel metre değeri   |
| Yapının durumu  | `buildingCondition`     | `BuildingCondition`      |
| Eşyalı          | `furnished`             | Boolean                  |
| Otopark         | `parkingType`           | `ParkingType`            |
| Devir dahil     | `transferIncluded`      | Boolean                  |
| Yıllık ciro     | `annualRevenue`         | Opsiyonel yıllık `Money` |

### Temel domain kuralları

- `netSquareMeters`, ilgili brüt veya toplam m² değerini aşamaz.
- `published` durumundaki ilanın en az bir onaylı fotoğrafı olmalıdır.
- `rejected` ve `changesRequested` durumlarında en az bir gerekçe ve açıklayıcı moderasyon notu bulunmalıdır.
- `promotionFlags` ile aktif `promotions` kayıtları tutarlı olmalıdır.
- `listingNo` değiştirilemez; `revision` içerik güncellemelerinde artırılır.
- Yayındaki bir ilanın kategori, fiyat, açıklama, konum veya fotoğraf alanlarında maddi değişiklik yapılırsa ilan otomatik olarak yeniden `pendingReview` durumuna alınır.
- `seller.type=realEstateOffice` veya `constructionCompany` olduğunda kurum doğrulama durumu admin ekranında gösterilir.
- Fiyat, m², tarih ve sayaçlar negatif değer alamaz.
- Kesin adres ve koordinatın son kullanıcıya gösterilip gösterilmeyeceği `location.showExactLocation` ile kontrol edilir.

## 1.2. Tam durum makinesi

### Durumlar

| TypeScript değeri  | Arayüz etiketi    | Kamuya görünür | Açıklama ve invariant                                                       |
| ------------------ | ----------------- | -------------: | --------------------------------------------------------------------------- |
| `draft`            | Taslak            |          Hayır | Henüz moderasyona gönderilmemiş, düzenlenebilir ilan                        |
| `pendingReview`    | İncelemede        |          Hayır | Moderasyon kuyruğunda karar bekleyen ilan                                   |
| `changesRequested` | Düzeltme Bekliyor |          Hayır | Giderilebilir sorunlar nedeniyle ilan sahibinden düzenleme bekleniyor       |
| `published`        | Onaylı / Yayında  |           Evet | Moderasyon kontrollerini geçmiş ve aktif olarak yayınlanan ilan             |
| `rejected`         | Reddedildi        |          Hayır | Politika veya kalite ihlali nedeniyle yayınlanması engellenmiş ilan         |
| `paused`           | Pasif             |          Hayır | Geçici olarak yayından kaldırılmış, süresi henüz dolmamış ilan              |
| `expired`          | Süresi Dolmuş     |          Hayır | `expiresAt` tarihine ulaşmış ilan                                           |
| `archived`         | Arşiv             |          Hayır | Operasyonel akıştan çıkarılmış; yalnızca geri yükleme ile taslağa dönebilir |

### İzin verilen geçişler

`İlan sahibi` ve `Sistem`, `AdminRole` değildir; tabloda yalnızca durum makinesinin eksiksiz olması için ayrı tetikleyiciler olarak gösterilir.

| Kaynak             | Hedef              | Tetikleyebilen admin rolü                    | Diğer tetikleyici       | Koşul                                                               |
| ------------------ | ------------------ | -------------------------------------------- | ----------------------- | ------------------------------------------------------------------- |
| `draft`            | `pendingReview`    | `superAdmin`, `moderator`                    | İlan sahibi             | Zorunlu alanlar geçerli, en az bir fotoğraf var                     |
| `draft`            | `archived`         | `superAdmin`, `moderator`                    | İlan sahibi             | Taslağın terk edilmesi veya silme yerine arşivleme                  |
| `pendingReview`    | `published`        | `superAdmin`, `moderator`, `icerikDenetcisi` | Yok                     | Bloklayıcı otomatik kontrol yok, zorunlu alanlar ve görseller uygun |
| `pendingReview`    | `changesRequested` | `superAdmin`, `moderator`, `icerikDenetcisi` | Yok                     | Giderilebilir sorun, en az bir gerekçe ve açıklama zorunlu          |
| `pendingReview`    | `rejected`         | `superAdmin`, `moderator`, `icerikDenetcisi` | Yok                     | Yayına engel ihlal, en az bir red gerekçesi ve not zorunlu          |
| `pendingReview`    | `draft`            | `superAdmin`, `moderator`                    | İlan sahibi             | İnceleme kararı verilmeden başvurunun geri çekilmesi                |
| `changesRequested` | `draft`            | `superAdmin`, `moderator`                    | İlan sahibi             | Düzenlemeye başlanması                                              |
| `changesRequested` | `pendingReview`    | `superAdmin`, `moderator`                    | İlan sahibi             | İstenen düzeltmeler yapılmış, `revision` artırılmış                 |
| `changesRequested` | `archived`         | `superAdmin`, `moderator`                    | İlan sahibi             | İlan sahibinin süreci sonlandırması                                 |
| `rejected`         | `pendingReview`    | `superAdmin`, `moderator`                    | Yok                     | İtiraz kabul edilmiş veya içerik maddi biçimde düzeltilmiş          |
| `rejected`         | `archived`         | `superAdmin`, `moderator`                    | Sistem                  | Saklama süresinin dolması veya manuel kapatma                       |
| `published`        | `pendingReview`    | `superAdmin`, `moderator`                    | Sistem                  | Kategori, fiyat, açıklama, konum veya fotoğrafta maddi değişiklik   |
| `published`        | `paused`           | `superAdmin`, `moderator`                    | İlan sahibi             | Geçici durdurma sebebi kaydedilmiş                                  |
| `published`        | `expired`          | Yok                                          | Sistem                  | `expiresAt` anına ulaşılmış                                         |
| `published`        | `archived`         | `superAdmin`, `moderator`                    | İlan sahibi             | Satıldı, kiralandı veya kalıcı olarak kapatıldı                     |
| `paused`           | `published`        | `superAdmin`, `moderator`                    | Sistem                  | Süre dolmamış, içerik değişmemiş, bloklayıcı kontrol yok            |
| `paused`           | `pendingReview`    | `superAdmin`, `moderator`                    | Sistem                  | Pasifken maddi içerik değişikliği yapılmış                          |
| `paused`           | `expired`          | Yok                                          | Sistem                  | Pasif durumdayken `expiresAt` anına ulaşılmış                       |
| `paused`           | `archived`         | `superAdmin`, `moderator`                    | İlan sahibi             | Kalıcı kapatma                                                      |
| `expired`          | `pendingReview`    | `superAdmin`, `moderator`                    | İlan sahibi             | Yayın süresi yenilenmiş ve ilan tekrar gönderilmiş                  |
| `expired`          | `archived`         | `superAdmin`, `moderator`                    | Sistem veya ilan sahibi | Yenilenmeden kapatma veya saklama süresinin dolması                 |
| `archived`         | `draft`            | `superAdmin`, `moderator`                    | Yok                     | Arşivden geri yükleme; doğrudan yayına dönülmez                     |

### Geçersiz geçişler

Aşağıdaki geçişler hiçbir rol tarafından doğrudan yapılamaz. İzin verilen tabloda bulunmayan tüm diğer geçişler de geçersizdir.

| Geçersiz geçiş                                     | Gerekçe                                                                    |
| -------------------------------------------------- | -------------------------------------------------------------------------- |
| `draft → published`                                | Moderasyon atlanamaz                                                       |
| `draft → rejected`                                 | İnceleme başlamadan moderasyon kararı üretilemez                           |
| `draft → paused`                                   | Daha önce yayınlanmamış ilan pasife alınamaz                               |
| `draft → expired`                                  | Yayın süresi başlamamıştır                                                 |
| `changesRequested → published`                     | Düzeltme sonrası yeniden inceleme gerekir                                  |
| `changesRequested → rejected`                      | Yeni karar için tekrar `pendingReview` gerekir                             |
| `rejected → published`                             | İtiraz veya düzeltme sonrası tekrar inceleme gerekir                       |
| `rejected → paused`                                | Reddedilmiş içerik daha önce aktif değildir                                |
| `rejected → draft`                                 | İtiraz kabulü önce `pendingReview` üretmelidir                             |
| `published → draft`                                | Yayındaki kayıt geçmişi korunmalı; maddi değişiklik `pendingReview` üretir |
| `published → changesRequested`                     | Önce yayından kaldırılıp `pendingReview` durumuna alınmalıdır              |
| `published → rejected`                             | Aktif ilan doğrudan reddedilmez; yeniden incelemeye alınır                 |
| `expired → published`                              | Süre yenileme ve tekrar inceleme gerekir                                   |
| `expired → paused`                                 | Süresi dolmuş ilan pasif hale getirilemez                                  |
| `archived → published`                             | Arşivden yalnızca taslağa dönülebilir                                      |
| `archived → pendingReview`                         | Önce taslakta içerik ve süre doğrulanmalıdır                               |
| `archived → rejected`                              | Arşivlenmiş kayıt üzerinde yeni moderasyon kararı üretilemez               |
| Aynı durumdan aynı duruma geçiş                    | Durum olayı değil, idempotent no-op kabul edilir                           |
| `destek` rolünün yaptığı herhangi bir durum geçişi | Destek rolü yalnızca görüntüleme, not ve eskalasyon yetkisine sahiptir     |

## 1.3. RejectionReason listesi

Aynı gerekçe hem `changesRequested` hem de `rejected` kararında kullanılabilir. Giderilebilir ihlaller ilk aşamada düzeltme isteği; ciddi, tekrarlanan veya yasaklı ihlaller doğrudan red üretmelidir.

| Değer                      | Arayüz etiketi             | Açıklama                                                                       |
| -------------------------- | -------------------------- | ------------------------------------------------------------------------------ |
| `yanlisKategori`           | Yanlış Kategori            | İlanın kategori, alt kategori veya işlem türü gerçek içerikle eşleşmiyor       |
| `mukerrerIlan`             | Mükerrer İlan              | Aynı gayrimenkul aynı veya ilişkili hesapta tekrar yayınlanmış                 |
| `yanilticiEksikBilgi`      | Yanıltıcı veya Eksik Bilgi | Başlık, açıklama veya öznitelikler eksik, çelişkili ya da yanıltıcı            |
| `uygunsuzGorsel`           | Uygunsuz Görsel            | Fotoğraf ilanla ilgisiz, filigranlı, manipüle edilmiş veya politika dışı       |
| `iletisimBilgisiIhlali`    | İletişim Bilgisi İhlali    | Başlık, açıklama veya görsel içine telefon, URL ya da yönlendirme eklenmiş     |
| `fiyatHatasi`              | Fiyat Hatası               | Fiyat sıfır, gerçek dışı, eksik sıfırlı veya yanlış para biriminde             |
| `yasakliIcerik`            | Yasaklı İçerik             | Hukuka, platform politikasına veya güvenlik kurallarına aykırı içerik          |
| `yanlisKonum`              | Yanlış Konum               | İl, ilçe veya mahalle bilgisi gayrimenkulün gerçek konumuyla uyuşmuyor         |
| `yetkiBelgesiEksik`        | Yetki Belgesi Eksik        | Emlak ofisi veya firma adına yayın için gerekli doğrulama bulunmuyor           |
| `belgeUyusmazligi`         | Belge Uyumsuzluğu          | Tapu, yetki veya ruhsat bilgileri ilan alanlarıyla çelişiyor                   |
| `baslikSpam`               | Spam Başlık                | Tekrarlı büyük harf, anahtar kelime doldurma veya yanıltıcı vurgu kullanılmış  |
| `fotografKalitesiYetersiz` | Fotoğraf Kalitesi Yetersiz | Fotoğraflar aşırı düşük çözünürlüklü, karanlık veya gayrimenkulü göstermiyor   |
| `kisiselVeriIhlali`        | Kişisel Veri İhlali        | Görsellerde veya açıklamada korunması gereken kişisel veri bulunuyor           |
| `sahteIlanSuphesi`         | Sahte İlan Şüphesi         | Gayrimenkulün varlığı, sahipliği veya fiyatı konusunda yüksek risk sinyali var |
| `digerPolitikaIhlali`      | Diğer Politika İhlali      | Tanımlı seçeneklere girmeyen; moderasyon notuyla açıklanması zorunlu ihlal     |

## 1.4. Roller ve yetki matrisi

### Rol tanımları

- `superAdmin`: Tüm ilan, kullanıcı, kategori, rol, izin, tema ve audit işlemlerini yönetir.
- `moderator`: İlan moderasyonu, arşivleme, rapor çözümleme ve sınırlı kullanıcı yaptırımlarını yönetir. Rol ve izin modelini değiştiremez.
- `icerikDenetcisi`: İnceleme kuyruğundaki ilanları onaylar, reddeder veya düzeltme ister. Kullanıcı, rol, kategori ve kalıcı arşiv işlemi yapamaz.
- `destek`: İlan ve kullanıcıları görüntüler, destek notu ekler, raporları triage eder ve moderatöre eskale eder. Durum kararı veremez.

### Yetki matrisi

| Yetki                                | `superAdmin` | `moderator` | `icerikDenetcisi` | `destek`                |
| ------------------------------------ | ------------ | ----------- | ----------------- | ----------------------- |
| Dashboard görüntüleme                | Tam          | Tam         | Tam               | Tam                     |
| İlan görüntüleme                     | Tam          | Tam         | Tam               | Tam                     |
| İlan içeriği düzenleme               | Tam          | Tam         | Yok               | Yok                     |
| İlanı incelemeye gönderme            | Tam          | Tam         | Yok               | Yok                     |
| İlan onaylama                        | Tam          | Tam         | Tam               | Yok                     |
| İlan reddetme                        | Tam          | Tam         | Tam               | Yok                     |
| Düzeltme isteme                      | Tam          | Tam         | Tam               | Yok                     |
| İlan pasife alma                     | Tam          | Tam         | Yok               | Yok                     |
| İlan arşivleme                       | Tam          | Tam         | Yok               | Yok                     |
| Arşivden geri yükleme                | Tam          | Tam         | Yok               | Yok                     |
| Toplu moderasyon                     | Tam          | Tam         | Yok               | Yok                     |
| İnceleyen atama                      | Tam          | Tam         | Yok               | Yok                     |
| Moderasyon notu ekleme               | Tam          | Tam         | Tam               | Tam                     |
| Promosyon yönetme                    | Tam          | Tam         | Yok               | Yok                     |
| Kullanıcı görüntüleme                | Tam          | Tam         | Yok               | Sınırlı                 |
| Kullanıcı bilgisi düzenleme          | Tam          | Sınırlı     | Yok               | Sınırlı destek alanları |
| Kullanıcı askıya alma                | Tam          | Tam         | Yok               | Yok                     |
| Kullanıcı banlama                    | Tam          | Tam         | Yok               | Yok                     |
| Admin rolü atama                     | Tam          | Yok         | Yok               | Yok                     |
| Kategori ve öznitelik görüntüleme    | Tam          | Tam         | Tam               | Yok                     |
| Kategori ve öznitelik değiştirme     | Tam          | Yok         | Yok               | Yok                     |
| Şikayet görüntüleme                  | Tam          | Tam         | Tam               | Tam                     |
| Şikayet triage etme                  | Tam          | Tam         | Sınırlı           | Tam                     |
| Şikayet çözümleme                    | Tam          | Tam         | Yok               | Yok                     |
| Rol ve izin yönetme                  | Tam          | Yok         | Yok               | Yok                     |
| Tema seçimi                          | Tam          | Tam         | Tam               | Tam                     |
| Sistem teması varsayılanı değiştirme | Tam          | Yok         | Yok               | Yok                     |
| Audit log görüntüleme                | Tam          | Tam         | Yok               | Yok                     |

## 1.5. Tam ve derlenebilir TypeScript domain tipleri

Aşağıdaki içerik `src/types/domain.ts` dosyasına tek parça olarak yazılmalıdır.

```ts
export type UUID = string
export type ISODate = `${number}-${number}-${number}`
export type ISODateTime = string

export enum ListingStatus {
  Draft = 'draft',
  PendingReview = 'pendingReview',
  ChangesRequested = 'changesRequested',
  Published = 'published',
  Rejected = 'rejected',
  Paused = 'paused',
  Expired = 'expired',
  Archived = 'archived',
}

export enum ListingCategory {
  Residential = 'konut',
  Land = 'arsa',
  Commercial = 'isyeri',
  Building = 'bina',
  Timeshare = 'devremulk',
  TourismFacility = 'turistikTesis',
}

export enum ResidentialSubCategory {
  Apartment = 'daire',
  Residence = 'rezidans',
  DetachedHouse = 'mustakilEv',
  Villa = 'villa',
  SummerHouse = 'yazlik',
  FarmHouse = 'ciftlikEvi',
  Prefabricated = 'prefabrik',
}

export enum LandSubCategory {
  ResidentialZoned = 'konutImarli',
  CommercialZoned = 'ticariImarli',
  IndustrialZoned = 'sanayiImarli',
  TourismZoned = 'turizmImarli',
  Field = 'tarla',
  VineyardGarden = 'bagBahce',
}

export enum CommercialSubCategory {
  ShopStore = 'dukkanMagaza',
  Office = 'ofis',
  Plaza = 'plaza',
  Warehouse = 'depoAntrepo',
  Factory = 'fabrika',
  Workshop = 'atolye',
}

export enum BuildingSubCategory {
  CompleteBuilding = 'kompleBina',
}

export enum TimeshareSubCategory {
  Timeshare = 'devremulk',
}

export enum TourismFacilitySubCategory {
  Hotel = 'otel',
  BoutiqueHotel = 'butikOtel',
  ApartHotel = 'apartOtel',
  Pension = 'pansiyon',
  Motel = 'motel',
  HolidayVillage = 'tatilKoyu',
  Campground = 'kampYeri',
}

export type ListingSubCategory =
  | ResidentialSubCategory
  | LandSubCategory
  | CommercialSubCategory
  | BuildingSubCategory
  | TimeshareSubCategory
  | TourismFacilitySubCategory

export enum ResidentialTransactionType {
  Sale = 'satilik',
  Rent = 'kiralik',
  DailyRent = 'gunlukKiralik',
}

export enum LandTransactionType {
  Sale = 'satilik',
  Rent = 'kiralik',
}

export enum CommercialTransactionType {
  Sale = 'satilik',
  Rent = 'kiralik',
  Transfer = 'devren',
}

export enum BuildingTransactionType {
  Sale = 'satilik',
  Rent = 'kiralik',
}

export enum TimeshareTransactionType {
  Sale = 'satilik',
  Rent = 'kiralik',
}

export enum TourismFacilityTransactionType {
  Sale = 'satilik',
  Rent = 'kiralik',
  Transfer = 'devren',
}

export type ListingTransactionType =
  | ResidentialTransactionType
  | LandTransactionType
  | CommercialTransactionType
  | BuildingTransactionType
  | TimeshareTransactionType
  | TourismFacilityTransactionType

export enum Currency {
  Try = 'TRY',
  Usd = 'USD',
  Eur = 'EUR',
  Gbp = 'GBP',
}

export enum PricePeriod {
  OneTime = 'tekSefer',
  Monthly = 'aylik',
  Daily = 'gunluk',
  Yearly = 'yillik',
}

export interface Money {
  amount: number
  currency: Currency
  period: PricePeriod
  negotiable: boolean
}

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface Location {
  countryCode: 'TR'
  cityCode: string
  cityName: string
  districtId: string
  districtName: string
  neighborhoodId: string
  neighborhoodName: string
  addressLine?: string
  postalCode?: string
  coordinates?: Coordinates
  showExactLocation: boolean
}

export enum RejectionReason {
  WrongCategory = 'yanlisKategori',
  DuplicateListing = 'mukerrerIlan',
  MisleadingOrIncompleteInfo = 'yanilticiEksikBilgi',
  InappropriateImage = 'uygunsuzGorsel',
  ContactInformationViolation = 'iletisimBilgisiIhlali',
  PricingError = 'fiyatHatasi',
  ProhibitedContent = 'yasakliIcerik',
  IncorrectLocation = 'yanlisKonum',
  MissingAuthorizationDocument = 'yetkiBelgesiEksik',
  DocumentMismatch = 'belgeUyusmazligi',
  SpamTitle = 'baslikSpam',
  InsufficientPhotoQuality = 'fotografKalitesiYetersiz',
  PersonalDataViolation = 'kisiselVeriIhlali',
  SuspectedFraud = 'sahteIlanSuphesi',
  OtherPolicyViolation = 'digerPolitikaIhlali',
}

export enum AssetModerationStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

export interface ListingPhoto {
  id: UUID
  url: string
  thumbnailUrl: string
  altText: string
  order: number
  isCover: boolean
  width: number
  height: number
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
  moderationStatus: AssetModerationStatus
  rejectionReason?: RejectionReason
  moderationNote?: string
}

export enum SellerType {
  Owner = 'sahibinden',
  RealEstateOffice = 'emlakOfisi',
  ConstructionCompany = 'insaatFirmasi',
}

export enum SellerVerificationStatus {
  Unverified = 'unverified',
  Pending = 'pending',
  Verified = 'verified',
  Rejected = 'rejected',
}

export interface SellerSummary {
  id: UUID
  type: SellerType
  displayName: string
  companyName?: string
  avatarUrl?: string
  verificationStatus: SellerVerificationStatus
}

export interface ListingContact {
  phone: string
  email?: string
  allowPhone: boolean
  allowMessage: boolean
  preferredContactMethod: 'phone' | 'message' | 'both'
}

export enum PromotionType {
  Featured = 'oneCikan',
  Urgent = 'acil',
  Showcase = 'vitrin',
  HomepageShowcase = 'anasayfaVitrini',
  CategoryFeatured = 'kategoriOneCikan',
}

export interface PromotionFlags {
  oneCikan: boolean
  acil: boolean
  vitrin: boolean
  anasayfaVitrini: boolean
  kategoriOneCikan: boolean
}

export enum PromotionStatus {
  Scheduled = 'scheduled',
  Active = 'active',
  Expired = 'expired',
  Cancelled = 'cancelled',
}

export interface ListingPromotion {
  id: UUID
  type: PromotionType
  status: PromotionStatus
  purchasedAt: ISODateTime
  startsAt: ISODateTime
  endsAt: ISODateTime
  source: 'paid' | 'manualAdmin'
  activatedByAdminId?: UUID
}

export enum ListingSource {
  Web = 'web',
  Mobile = 'mobile',
  Api = 'api',
  AdminImport = 'adminImport',
}

export interface ListingMetrics {
  viewCount: number
  favoriteCount: number
  messageCount: number
  reportCount: number
}

export enum AutomatedCheckCode {
  RequiredFields = 'requiredFields',
  DuplicateContent = 'duplicateContent',
  PriceAnomaly = 'priceAnomaly',
  ContactInfoDetection = 'contactInfoDetection',
  ImageQuality = 'imageQuality',
  ImageSafety = 'imageSafety',
  LocationConsistency = 'locationConsistency',
  FraudRisk = 'fraudRisk',
}

export enum AutomatedCheckResultStatus {
  Passed = 'passed',
  Warning = 'warning',
  Failed = 'failed',
}

export interface AutomatedCheckResult {
  code: AutomatedCheckCode
  status: AutomatedCheckResultStatus
  score?: number
  message: string
  checkedAt: ISODateTime
}

export interface ModerationSummary {
  currentReviewerId?: UUID
  submittedAt?: ISODateTime
  lastReviewedAt?: ISODateTime
  rejectionReasons: RejectionReason[]
  reviewNote?: string
  automatedChecks: AutomatedCheckResult[]
}

export type RoomCount =
  | '1+0'
  | '1+1'
  | '2+1'
  | '2+2'
  | '3+1'
  | '3+2'
  | '4+1'
  | '4+2'
  | '5+1'
  | '5+2'
  | '6+1'
  | '7+1'
  | '8+'
  | 'diger'

export enum BuildingAge {
  New = '0',
  OneToFive = '1-5',
  SixToTen = '6-10',
  ElevenToFifteen = '11-15',
  SixteenToTwenty = '16-20',
  TwentyOnePlus = '21+',
}

export type FloorLocation =
  | 'bodrumKat'
  | 'bahceKati'
  | 'zeminKat'
  | 'yuksekGiris'
  | 'girisKati'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11-20'
  | '21-30'
  | '30+'
  | 'catiKati'
  | 'mustakil'

export enum HeatingType {
  NaturalGasCombi = 'dogalgazKombi',
  Central = 'merkezi',
  FloorFurnace = 'katKaloriferi',
  Underfloor = 'yerden',
  AirConditioner = 'klima',
  Stove = 'soba',
  FanCoil = 'fanCoil',
  HeatPump = 'isiPompasi',
  None = 'yok',
}

export type BathroomCount = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export enum ParkingType {
  None = 'yok',
  Open = 'acik',
  Closed = 'kapali',
  OpenAndClosed = 'acikVeKapali',
}

export enum OccupancyStatus {
  Vacant = 'bos',
  Tenant = 'kiraci',
  Owner = 'mulkSahibi',
}

export enum LoanEligibility {
  Eligible = 'uygun',
  Ineligible = 'uygunDegil',
  Unknown = 'bilinmiyor',
}

export enum TitleDeedStatus {
  Condominium = 'katMulkiyeti',
  ConstructionServitude = 'katIrtifaki',
  Shared = 'hisseli',
  LandTitle = 'arsaTapulu',
}

export interface ResidentialAttributes {
  grossSquareMeters: number
  netSquareMeters: number
  roomCount: RoomCount
  buildingAge: BuildingAge
  floorLocation: FloorLocation
  floorCount: number
  heatingType: HeatingType
  bathroomCount: BathroomCount
  hasBalcony: boolean
  hasElevator: boolean
  parkingType: ParkingType
  furnished: boolean
  occupancyStatus: OccupancyStatus
  inComplex: boolean
  complexName?: string
  monthlyFee?: Money
  loanEligibility: LoanEligibility
  titleDeedStatus: TitleDeedStatus
  swapAccepted: boolean
}

export enum ZoningStatus {
  Residential = 'konut',
  Commercial = 'ticari',
  Industrial = 'sanayi',
  Tourism = 'turizm',
  Field = 'tarla',
  VineyardGarden = 'bagBahce',
  Unplanned = 'plansiz',
  Other = 'diger',
}

export enum InfrastructureType {
  Electricity = 'elektrik',
  Water = 'su',
  NaturalGas = 'dogalgaz',
  Sewer = 'kanalizasyon',
  Road = 'yol',
}

export interface LandAttributes {
  squareMeters: number
  zoningStatus: ZoningStatus
  block?: string
  parcel?: string
  mapSheet?: string
  floorAreaRatio?: number
  maxBuildingHeightMeters?: number
  pricePerSquareMeter: Money
  roadFrontageMeters?: number
  infrastructure: InfrastructureType[]
}

export enum BuildingCondition {
  New = 'sifir',
  Used = 'ikinciEl',
  UnderConstruction = 'yapimAsamasinda',
  RenovationRequired = 'renovasyonGerekli',
}

export interface CommercialAttributes {
  squareMeters: number
  roomCount: number | 'acikPlan'
  floorCount: number
  floorLocation?: FloorLocation
  heatingType: HeatingType
  deposit?: Money
  buildingCondition: BuildingCondition
  hasElevator: boolean
  parkingType: ParkingType
  furnished: boolean
  monthlyFee?: Money
  transferFee?: Money
  occupancyStatus: OccupancyStatus
}

export enum BuildingUsageType {
  Residential = 'konut',
  Commercial = 'ticari',
  Mixed = 'karma',
}

export interface BuildingAttributes {
  totalSquareMeters: number
  netSquareMeters?: number
  buildingAge: BuildingAge
  floorCount: number
  independentUnitCount: number
  hasOccupancyPermit: boolean
  hasElevator: boolean
  parkingType: ParkingType
  heatingType: HeatingType
  usageType: BuildingUsageType
  monthlyRentalIncome?: Money
  titleDeedStatus: TitleDeedStatus
  swapAccepted: boolean
}

export enum TimeshareSeason {
  Spring = 'ilkbahar',
  Summer = 'yaz',
  Autumn = 'sonbahar',
  Winter = 'kis',
  AllYear = 'tumYil',
}

export interface TimeshareAttributes {
  facilityName: string
  squareMeters: number
  roomCount: RoomCount
  usagePeriod: string
  usageDays: number
  season: TimeshareSeason
  annualMaintenanceFee: Money
  titleDeedStatus: TitleDeedStatus
  exchangeProgram?: string
  furnished: boolean
}

export type StarRating = 1 | 2 | 3 | 4 | 5

export interface TourismFacilityAttributes {
  roomCount: number
  bedCount: number
  starRating?: StarRating
  floorCount: number
  indoorSquareMeters: number
  outdoorSquareMeters: number
  buildingAge: BuildingAge
  hasOperatingLicense: boolean
  hasAlcoholLicense: boolean
  distanceToBeachMeters?: number
  buildingCondition: BuildingCondition
  furnished: boolean
  parkingType: ParkingType
  transferIncluded: boolean
  annualRevenue?: Money
}

export interface ListingBase {
  id: UUID
  listingNo: string
  title: string
  description: string
  status: ListingStatus
  price: Money
  location: Location
  photos: ListingPhoto[]
  listingDate: ISODateTime
  createdAt: ISODateTime
  updatedAt: ISODateTime
  submittedAt?: ISODateTime
  publishedAt?: ISODateTime
  expiresAt?: ISODateTime
  ownerUserId: UUID
  seller: SellerSummary
  contact: ListingContact
  promotionFlags: PromotionFlags
  promotions: ListingPromotion[]
  moderation: ModerationSummary
  metrics: ListingMetrics
  source: ListingSource
  revision: number
  tags: string[]
}

export interface ResidentialListing extends ListingBase {
  category: ListingCategory.Residential
  transactionType: ResidentialTransactionType
  subCategory: ResidentialSubCategory
  attributes: ResidentialAttributes
}

export interface LandListing extends ListingBase {
  category: ListingCategory.Land
  transactionType: LandTransactionType
  subCategory: LandSubCategory
  attributes: LandAttributes
}

export interface CommercialListing extends ListingBase {
  category: ListingCategory.Commercial
  transactionType: CommercialTransactionType
  subCategory: CommercialSubCategory
  attributes: CommercialAttributes
}

export interface BuildingListing extends ListingBase {
  category: ListingCategory.Building
  transactionType: BuildingTransactionType
  subCategory: BuildingSubCategory
  attributes: BuildingAttributes
}

export interface TimeshareListing extends ListingBase {
  category: ListingCategory.Timeshare
  transactionType: TimeshareTransactionType
  subCategory: TimeshareSubCategory
  attributes: TimeshareAttributes
}

export interface TourismFacilityListing extends ListingBase {
  category: ListingCategory.TourismFacility
  transactionType: TourismFacilityTransactionType
  subCategory: TourismFacilitySubCategory
  attributes: TourismFacilityAttributes
}

export type Listing =
  | ResidentialListing
  | LandListing
  | CommercialListing
  | BuildingListing
  | TimeshareListing
  | TourismFacilityListing

export enum AdminRole {
  SuperAdmin = 'superAdmin',
  Moderator = 'moderator',
  ContentReviewer = 'icerikDenetcisi',
  Support = 'destek',
}

export enum AdminPermission {
  DashboardView = 'dashboard:view',

  ListingView = 'listing:view',
  ListingEdit = 'listing:edit',
  ListingSubmit = 'listing:submit',
  ListingApprove = 'listing:approve',
  ListingReject = 'listing:reject',
  ListingRequestChanges = 'listing:requestChanges',
  ListingPause = 'listing:pause',
  ListingArchive = 'listing:archive',
  ListingRestore = 'listing:restore',
  ListingBulkModerate = 'listing:bulkModerate',
  ListingAssignReviewer = 'listing:assignReviewer',
  ListingAddNote = 'listing:addNote',
  PromotionManage = 'promotion:manage',

  UserView = 'user:view',
  UserEdit = 'user:edit',
  UserSuspend = 'user:suspend',
  UserBan = 'user:ban',
  UserAssignRole = 'user:assignRole',

  CategoryView = 'category:view',
  CategoryManage = 'category:manage',

  ReportView = 'report:view',
  ReportTriage = 'report:triage',
  ReportResolve = 'report:resolve',

  SettingsView = 'settings:view',
  PermissionManage = 'permission:manage',
  ThemeManage = 'theme:manage',

  AuditView = 'audit:view',
}

export const ALL_ADMIN_PERMISSIONS = [
  AdminPermission.DashboardView,
  AdminPermission.ListingView,
  AdminPermission.ListingEdit,
  AdminPermission.ListingSubmit,
  AdminPermission.ListingApprove,
  AdminPermission.ListingReject,
  AdminPermission.ListingRequestChanges,
  AdminPermission.ListingPause,
  AdminPermission.ListingArchive,
  AdminPermission.ListingRestore,
  AdminPermission.ListingBulkModerate,
  AdminPermission.ListingAssignReviewer,
  AdminPermission.ListingAddNote,
  AdminPermission.PromotionManage,
  AdminPermission.UserView,
  AdminPermission.UserEdit,
  AdminPermission.UserSuspend,
  AdminPermission.UserBan,
  AdminPermission.UserAssignRole,
  AdminPermission.CategoryView,
  AdminPermission.CategoryManage,
  AdminPermission.ReportView,
  AdminPermission.ReportTriage,
  AdminPermission.ReportResolve,
  AdminPermission.SettingsView,
  AdminPermission.PermissionManage,
  AdminPermission.ThemeManage,
  AdminPermission.AuditView,
] as const satisfies readonly AdminPermission[]

export const ROLE_PERMISSIONS = {
  [AdminRole.SuperAdmin]: ALL_ADMIN_PERMISSIONS,

  [AdminRole.Moderator]: [
    AdminPermission.DashboardView,
    AdminPermission.ListingView,
    AdminPermission.ListingEdit,
    AdminPermission.ListingSubmit,
    AdminPermission.ListingApprove,
    AdminPermission.ListingReject,
    AdminPermission.ListingRequestChanges,
    AdminPermission.ListingPause,
    AdminPermission.ListingArchive,
    AdminPermission.ListingRestore,
    AdminPermission.ListingBulkModerate,
    AdminPermission.ListingAssignReviewer,
    AdminPermission.ListingAddNote,
    AdminPermission.PromotionManage,
    AdminPermission.UserView,
    AdminPermission.UserEdit,
    AdminPermission.UserSuspend,
    AdminPermission.UserBan,
    AdminPermission.CategoryView,
    AdminPermission.ReportView,
    AdminPermission.ReportTriage,
    AdminPermission.ReportResolve,
    AdminPermission.SettingsView,
    AdminPermission.ThemeManage,
    AdminPermission.AuditView,
  ],

  [AdminRole.ContentReviewer]: [
    AdminPermission.DashboardView,
    AdminPermission.ListingView,
    AdminPermission.ListingApprove,
    AdminPermission.ListingReject,
    AdminPermission.ListingRequestChanges,
    AdminPermission.ListingAddNote,
    AdminPermission.CategoryView,
    AdminPermission.ReportView,
    AdminPermission.ReportTriage,
    AdminPermission.SettingsView,
    AdminPermission.ThemeManage,
  ],

  [AdminRole.Support]: [
    AdminPermission.DashboardView,
    AdminPermission.ListingView,
    AdminPermission.ListingAddNote,
    AdminPermission.UserView,
    AdminPermission.UserEdit,
    AdminPermission.ReportView,
    AdminPermission.ReportTriage,
    AdminPermission.SettingsView,
    AdminPermission.ThemeManage,
  ],
} satisfies Record<AdminRole, readonly AdminPermission[]>

export enum ModerationActorType {
  Admin = 'admin',
  ListingOwner = 'listingOwner',
  System = 'system',
}

export enum ModerationEventType {
  Created = 'created',
  Submitted = 'submitted',
  Assigned = 'assigned',
  Approved = 'approved',
  Rejected = 'rejected',
  ChangesRequested = 'changesRequested',
  Withdrawn = 'withdrawn',
  Edited = 'edited',
  Paused = 'paused',
  Resumed = 'resumed',
  Expired = 'expired',
  Archived = 'archived',
  Restored = 'restored',
  NoteAdded = 'noteAdded',
  ReportLinked = 'reportLinked',
}

export interface ModerationActor {
  type: ModerationActorType
  id?: UUID
  displayName: string
  adminRole?: AdminRole
}

export interface ModerationEvent {
  id: UUID
  listingId: UUID
  eventType: ModerationEventType
  fromStatus?: ListingStatus
  toStatus?: ListingStatus
  actor: ModerationActor
  rejectionReasons: RejectionReason[]
  note?: string
  revision: number
  createdAt: ISODateTime
}

export enum ListingTransitionTrigger {
  OwnerSubmit = 'ownerSubmit',
  OwnerWithdraw = 'ownerWithdraw',
  AdminDecision = 'adminDecision',
  MaterialEdit = 'materialEdit',
  PauseRequested = 'pauseRequested',
  PauseEnded = 'pauseEnded',
  ExpiryReached = 'expiryReached',
  AppealAccepted = 'appealAccepted',
  RenewalRequested = 'renewalRequested',
  ArchiveRequested = 'archiveRequested',
  RestoreRequested = 'restoreRequested',
  RetentionExpired = 'retentionExpired',
}

export interface ListingTransitionRule {
  from: ListingStatus
  to: ListingStatus
  allowedAdminRoles: AdminRole[]
  allowedActorTypes: ModerationActorType[]
  trigger: ListingTransitionTrigger
  requiresReason: boolean
  requiresNote: boolean
}

export interface ListingStatusTransitionRequest {
  listingId: UUID
  expectedRevision: number
  targetStatus: ListingStatus
  actor: ModerationActor
  trigger: ListingTransitionTrigger
  rejectionReasons: RejectionReason[]
  note?: string
}

export enum UserType {
  Individual = 'individual',
  RealEstateOffice = 'realEstateOffice',
  ConstructionCompany = 'constructionCompany',
  Admin = 'admin',
}

export enum UserStatus {
  PendingVerification = 'pendingVerification',
  Active = 'active',
  Suspended = 'suspended',
  Banned = 'banned',
}

export interface UserAccount {
  id: UUID
  fullName: string
  email: string
  phone: string
  avatarUrl?: string
  type: UserType
  status: UserStatus
  adminRole?: AdminRole
  verified: boolean
  companyName?: string
  createdAt: ISODateTime
  updatedAt: ISODateTime
  lastLoginAt?: ISODateTime
  listingCount: number
  activeListingCount: number
  reportCount: number
}

export interface UserSanction {
  id: UUID
  userId: UUID
  type: 'suspension' | 'ban'
  reason: string
  startsAt: ISODateTime
  endsAt?: ISODateTime
  createdByAdminId: UUID
  createdAt: ISODateTime
  revokedAt?: ISODateTime
}

export enum ReportReason {
  MisleadingInformation = 'misleadingInformation',
  DuplicateListing = 'duplicateListing',
  SoldOrRented = 'soldOrRented',
  WrongCategory = 'wrongCategory',
  SuspectedFraud = 'suspectedFraud',
  InappropriateContent = 'inappropriateContent',
  ContactViolation = 'contactViolation',
  PriceManipulation = 'priceManipulation',
  Other = 'other',
}

export enum ReportStatus {
  Open = 'open',
  InReview = 'inReview',
  Resolved = 'resolved',
  Dismissed = 'dismissed',
}

export enum ReportSeverity {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export interface ListingReport {
  id: UUID
  listingId: UUID
  reporterUserId?: UUID
  reason: ReportReason
  detail?: string
  status: ReportStatus
  severity: ReportSeverity
  assignedAdminId?: UUID
  resolutionNote?: string
  createdAt: ISODateTime
  updatedAt: ISODateTime
  resolvedAt?: ISODateTime
}

export enum AttributeDataType {
  Text = 'text',
  Number = 'number',
  Boolean = 'boolean',
  SingleSelect = 'singleSelect',
  MultiSelect = 'multiSelect',
  Money = 'money',
}

export interface AttributeOption {
  value: string
  label: string
  order: number
  active: boolean
}

export interface AttributeValidation {
  min?: number
  max?: number
  maxLength?: number
  pattern?: string
}

export interface CategoryAttributeDefinition {
  id: UUID
  category: ListingCategory
  appliesToSubCategories: ListingSubCategory[]
  appliesToTransactionTypes: ListingTransactionType[]
  key: string
  label: string
  description?: string
  dataType: AttributeDataType
  required: boolean
  filterable: boolean
  visibleInList: boolean
  active: boolean
  order: number
  options: AttributeOption[]
  validation: AttributeValidation
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface TimeSeriesPoint {
  date: ISODate
  value: number
}

export interface CategoryDistributionItem {
  category: ListingCategory
  count: number
  ratio: number
}

export interface DashboardMetrics {
  pendingReviewCount: number
  newListingCountToday: number
  publishedListingCount: number
  rejectedListingCount: number
  rejectionRate: number
  averageReviewMinutes: number
  openReportCount: number
  dailyNewListings: TimeSeriesPoint[]
  dailyModerationCount: TimeSeriesPoint[]
  categoryDistribution: CategoryDistributionItem[]
}

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface AuditLogEntry {
  id: UUID
  actorId: UUID
  actorName: string
  actorRole: AdminRole
  action: string
  entityType: 'listing' | 'user' | 'report' | 'category' | 'permission' | 'theme'
  entityId: UUID
  summary: string
  metadata: Record<string, unknown>
  createdAt: ISODateTime
}
```

# ADIM 2 — EKRAN VE DURUM LİSTESİ

## 2.1. Ortak ekran durumu sözleşmesi

Her veri ekranı aşağıdaki durumları açıkça desteklemelidir:

| Durum             | Davranış                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------- |
| `idle`            | İlk sorgu henüz başlatılmamış                                                             |
| `loading`         | İçerik ölçülerini koruyan skeleton gösterilir; yalnızca spinner ile boş ekran gösterilmez |
| `success`         | Veriler ve kullanılabilir eylemler gösterilir                                             |
| `empty`           | Ekrana özel açıklama, filtre temizleme veya ana eylem içeren `EmptyState` gösterilir      |
| `error`           | Hata mesajı, hata kodu ve yeniden deneme eylemi gösterilir                                |
| `stale`           | Son başarılı veri gösterilmeye devam eder; üstte güncelleme uyarısı bulunur               |
| `unauthorized`    | Kullanıcının rolüne göre 403 durumu ve güvenli geri dönüş bağlantısı gösterilir           |
| `mutationPending` | Etkilenen eylem kilitlenir; tüm ekran gereksiz yere devre dışı bırakılmaz                 |
| `mutationSuccess` | Toast gösterilir, liste veya detay deterministik şekilde güncellenir                      |
| `mutationError`   | İşlem geri alınır veya mevcut veri korunur; açıklayıcı hata gösterilir                    |

## 2.2. Dashboard / İstatistikler

### Görünen veriler

- Bekleyen onay sayısı.
- Bugünkü yeni ilan sayısı.
- Toplam yayındaki ilan sayısı.
- Günlük ve haftalık onay/red sayısı.
- Kategori dağılımı.
- Red oranı.
- Ortalama inceleme süresi.
- Açık şikayet sayısı.
- En uzun süredir bekleyen ilanlar.
- Son moderasyon işlemleri.
- Moderatör bazında işlem hacmi; yalnızca yetkili rollere.

### Eylemler

- Tarih aralığı değiştirme.
- Kategori, işlem türü ve moderatör filtresi uygulama.
- KPI kartından filtrelenmiş ilan listesine gitme.
- Bekleyen ilanlardan moderasyon kuyruğuna geçme.
- Grafik verisini CSV olarak dışa aktarma.
- Dashboard verisini yenileme.

### Ekran durumları

- `loading`: Stat kart ve grafik skeleton’ları.
- `empty`: Seçilen tarih aralığında veri yok.
- `error`: KPI ve grafik sorguları için bağımsız hata blokları.
- `success`: Tüm metrikler.
- `partialSuccess`: Bazı grafikler yüklenemese de başarılı kartlar görünür.
- `stale`: Son veri görünür, yenilenemedi uyarısı gösterilir.

### Türetilen componentler

`StatCard`, `ChartCard`, `DateRangePicker`, `FilterBar`, `DataTable`, `StatusBadge`, `EmptyState`, `ErrorState`, `DashboardStats`.

## 2.3. İlan Listesi ve Filtreleme

### Görünen veriler

- Kapak fotoğrafı.
- İlan no.
- Başlık.
- Kategori, alt kategori ve işlem türü.
- İl, ilçe ve mahalle.
- Fiyat.
- Kimden bilgisi.
- İlan durumu.
- İlan tarihi ve güncellenme tarihi.
- İnceleyen moderatör.
- Promosyon işaretleri.
- Rapor sayısı.
- Görüntülenme sayısı.
- Satır seçimi.

### Filtreler

- Serbest metin: ilan no, başlık veya kullanıcı.
- Kategori.
- Alt kategori.
- İşlem türü.
- Durum.
- İl, ilçe ve mahalle.
- Minimum ve maksimum fiyat.
- Para birimi.
- İlan tarihi aralığı.
- Güncellenme tarihi aralığı.
- Kimden.
- Promosyon tipi.
- Raporlu ilanlar.
- İnceleyen moderatör.
- Kayıtlı filtre görünümü.

### Eylemler

- İlan detayına gitme.
- İlanı düzenleme.
- İncelemeye gönderme.
- Pasife alma.
- Arşivleme.
- Arşivden geri yükleme.
- Promosyon ekleme veya kaldırma.
- Yetkiye göre toplu onay, red, arşivleme veya moderatör atama.
- Sıralama.
- Sayfalama.
- Görünür kolonları seçme.
- Filtreleri kaydetme ve temizleme.

### Ekran durumları

- `loading`: Tablo başlığı korunur, satır skeleton’ları gösterilir.
- `empty`: Hiç ilan yok.
- `filteredEmpty`: Filtre sonucu yok; filtreleri temizle eylemi gösterilir.
- `error`: Yeniden dene.
- `success`: Tablo veya mobil kart görünümü.
- `mutationPending`: Etkilenen satır ve toplu işlem çubuğu kilitlenir.
- `selection`: En az bir satır seçildiğinde `BulkActionBar` görünür.

### Türetilen componentler

`SearchInput`, `FilterBar`, `DataTable`, `ListingCard`, `StatusBadge`, `PromotionFlagsPanel`, `BulkActionBar`, `Pagination`, `ConfirmDialog`, `ListingListPage`.

## 2.4. Onay / Moderasyon Kuyruğu

### Görünen veriler

- Sıradaki ilanlar.
- Kuyruk sırası ve bekleme süresi.
- İlan özeti.
- Kategori ve fiyat.
- Otomatik kontrol sonuçları.
- Rapor sayısı.
- Yüksek risk işareti.
- Atanmış moderatör.
- İlanın revizyon sayısı.
- Son düzeltme notu.

### Eylemler

- İlanı sahiplenme veya moderatör atama.
- Hızlı onay.
- Hızlı red.
- Düzeltme isteme.
- İlanı atlama ve sıradaki ilana geçme.
- Detaylı inceleme ekranını açma.
- Kuyruk önceliğini değiştirme; yalnızca `superAdmin` veya `moderator`.
- Klavye kısayollarıyla karar verme; karar öncesi doğrulama zorunlu.

### Ekran durumları

- `loading`.
- `empty`: Tüm kuyruk tamamlandı.
- `error`.
- `success`.
- `decisionPending`.
- `conflict`: Başka moderatör ilanın revizyonunu değiştirmiş.
- `locked`: İlan başka moderatör tarafından aktif inceleniyor.

### Türetilen componentler

`ListingCard`, `StatusBadge`, `ModerationActionBar`, `RejectionReasonPicker`, `AutomatedChecksPanel`, `Pagination`, `ApprovalQueue`.

## 2.5. İlan Detay / İnceleme Ekranı

### Görünen veriler

- İlanın tüm ortak alanları.
- Kategoriye özel tüm öznitelikler.
- Büyük fotoğraf galerisi.
- Fotoğraf bazlı moderasyon durumu.
- Konum özeti ve koordinat.
- İlan sahibi ve doğrulama durumu.
- İletişim bilgileri.
- Promosyon durumu.
- Otomatik kontrol sonuçları.
- Açık şikayetler.
- Moderasyon geçmişi.
- Revizyon geçmişi.
- Önceki ve yeni değer farkları.
- Benzer veya mükerrer ilan önerileri.
- Admin notları.

### Eylemler

- Onaylama.
- Reddetme.
- Düzeltme isteme.
- Red sebebi seçme.
- Moderasyon notu ekleme.
- Fotoğrafı tekil olarak uygunsuz işaretleme.
- İlanı pasife alma.
- Arşivleme.
- Kullanıcı detayına gitme.
- Şikayet detayına gitme.
- Benzer ilanı yeni sekmede açma.
- Revizyonlar arasında karşılaştırma.
- Önceki veya sonraki kuyruk ilanına geçme.

### Ekran durumları

- `loading`.
- `error`.
- `success`.
- `notFound`.
- `unauthorized`.
- `decisionPending`.
- `decisionSuccess`.
- `revisionConflict`.
- `deletedOrArchivedDuringReview`.
- Fotoğraf galerisi için bağımsız `loading`, `empty`, `error`.

### Türetilen componentler

`ImageGallery`, `ListingFacts`, `LocationPanel`, `SellerPanel`, `PromotionFlagsPanel`, `ModerationHistory`, `AutomatedChecksPanel`, `RejectionReasonPicker`, `ModerationActionBar`, `ConfirmDialog`, `ListingReviewPanel`.

## 2.6. Kullanıcı Yönetimi

### Görünen veriler

- Kullanıcı adı.
- Kullanıcı tipi.
- E-posta ve telefon.
- Doğrulama durumu.
- Hesap durumu.
- Admin rolü; yalnızca admin kullanıcılarında.
- Toplam ve aktif ilan sayısı.
- Şikayet sayısı.
- Son giriş.
- Kayıt tarihi.
- Aktif yaptırım.

### Eylemler

- Kullanıcı arama ve filtreleme.
- Kullanıcı detayına gitme.
- Kullanıcı ilanlarını açma.
- İletişim veya doğrulama alanlarını düzenleme.
- Askıya alma.
- Banlama.
- Yaptırımı kaldırma.
- Admin rolü atama; yalnızca `superAdmin`.
- Destek notu ekleme.
- İşlem geçmişini görüntüleme.

### Ekran durumları

- `loading`.
- `empty`.
- `filteredEmpty`.
- `error`.
- `success`.
- `banPending`.
- `roleChangePending`.
- `roleChangeConflict`.
- `unauthorized`.

### Türetilen componentler

`DataTable`, `FilterBar`, `Avatar`, `StatusBadge`, `UserSummaryCard`, `RolePermissionMatrix`, `ConfirmDialog`, `UserManagementPage`, `UserDetailPage`.

## 2.7. Kategori ve Öznitelik Yönetimi

### Görünen veriler

- Kategori ağacı.
- İşlem türleri.
- Alt kategoriler.
- Öznitelik anahtarı ve etiketi.
- Veri tipi.
- Zorunluluk durumu.
- Filtrelenebilirlik.
- Liste ekranında görünürlük.
- Seçenekler.
- Minimum, maksimum ve regex doğrulamaları.
- Aktif/pasif durumu.
- Sıralama.
- Son güncelleyen admin ve tarih.

### Eylemler

- Kategori düğümü seçme.
- Öznitelik ekleme.
- Öznitelik düzenleme.
- Seçenek ekleme veya sıralama.
- Özniteliği pasife alma.
- Önizleme.
- Taslağı kaydetme.
- Değişiklikleri yayınlama.
- Yayın öncesi etkilenen ilan sayısını görüntüleme.

### Ekran durumları

- `loading`.
- `empty`.
- `error`.
- `success`.
- `editing`.
- `dirty`.
- `saving`.
- `validationError`.
- `publishPending`.
- `conflict`.

### Türetilen componentler

`CategoryTree`, `AttributeEditor`, `DataTable`, `Tabs`, `Accordion`, `ConfirmDialog`, `CategoryAttributePage`.

## 2.8. Şikayet / Rapor Yönetimi

### Görünen veriler

- Şikayet kimliği.
- İlan özeti.
- Şikayet sebebi.
- Şiddet seviyesi.
- Şikayet eden kullanıcı.
- Şikayet tarihi.
- Durum.
- Atanan admin.
- Benzer şikayet sayısı.
- Çözüm notu.
- İlanın mevcut durumu.

### Eylemler

- Raporu sahiplenme.
- İncelemeye alma.
- İlan detayına gitme.
- Kullanıcı detayına gitme.
- Raporu çözümleme.
- Raporu geçersiz sayma.
- Moderatöre eskale etme.
- İlanı yeniden moderasyon kuyruğuna alma.
- Toplu rapor birleştirme.

### Ekran durumları

- `loading`.
- `empty`.
- `filteredEmpty`.
- `error`.
- `success`.
- `resolutionPending`.
- `alreadyResolved`.
- `linkedListingUnavailable`.

### Türetilen componentler

`DataTable`, `ReportCard`, `FilterBar`, `StatusBadge`, `BulkActionBar`, `ConfirmDialog`, `ReportManagementPage`.

## 2.9. Ayarlar

### Görünen veriler

- Roller.
- Rol başına izin matrisi.
- Tema seçenekleri.
- Aktif kullanıcı teması.
- Sistem varsayılan teması.
- Moderasyon tercihleri.
- İlan süreleri.
- Sayfalama varsayılanları.
- Audit özeti.

### Eylemler

- Rol izinlerini değiştirme; yalnızca `superAdmin`.
- Kullanıcı teması seçme.
- Sistem varsayılan temasını değiştirme; yalnızca `superAdmin`.
- Moderasyon davranış ayarlarını değiştirme.
- Değişiklikleri kaydetme.
- Varsayılana dönme.

### Ekran durumları

- `loading`.
- `error`.
- `success`.
- `dirty`.
- `saving`.
- `saved`.
- `unauthorized`.
- `permissionConflict`.

### Türetilen componentler

`RolePermissionMatrix`, `ThemeSelector`, `Tabs`, `Select`, `Switch`, `ConfirmDialog`, `SettingsPage`.

## 2.10. Audit Log

Bu ekran operasyonel güvenlik ve moderasyon izlenebilirliği için eklenmelidir.

### Görünen veriler

- Admin kullanıcı.
- Rol.
- Eylem.
- Varlık tipi.
- Varlık kimliği.
- Özet.
- Zaman.
- Önceki ve sonraki değerler.
- İstek veya işlem korelasyon kimliği.

### Eylemler

- Tarih, rol, kullanıcı ve eyleme göre filtreleme.
- İlgili varlığa gitme.
- JSON detayını açma.
- Yetkiye göre dışa aktarma.

### Ekran durumları

- `loading`.
- `empty`.
- `error`.
- `success`.
- `unauthorized`.

### Türetilen componentler

`DataTable`, `FilterBar`, `Drawer`, `CodeBlock`, `Pagination`, `AuditLogPage`.

## 2.11. Kimlik doğrulama ve erişim ekranları

### Ekranlar

- Admin giriş ekranı.
- Yetkisiz erişim, 403.
- Oturum süresi doldu.
- Sayfa bulunamadı, 404.
- Global beklenmeyen hata ekranı.

### Türetilen componentler

`Input`, `Button`, `Alert`, `EmptyState`, `ErrorState`, `AuthScreen`.

# ADIM 3 — COMPONENT LİSTESİ (ekranlardan türet)

## 3.1. Component mimarisi kuralları

- Primitives iş kuralı bilmez.
- Composites domain verisini görselleştirebilir ancak veri çekmez.
- Screen-level composition’lar sorgu sonucunu, izinleri ve ekran düzenini birleştirir.
- Storybook componentleri varsayılan olarak kontrollü olmalıdır.
- API çağrısı doğrudan component içine yazılmamalıdır.
- Story’ler fixture verisiyle çalışmalı, ağ bağlantısına bağımlı olmamalıdır.
- Görünür metin boyutu hiçbir componentte `1rem` altına düşmemelidir.
- Mobil görünüm temel görünüm olmalı; geniş ekran davranışı `min-width` media query’leriyle eklenmelidir.
- Etkileşimli kontrol hedefleri en az 44×44 piksel olmalıdır.
- Renk, gölge, radius, spacing veya tipografi component içinde sabit değer olarak yazılmamalıdır.
- Kritik componentlerde hem ayrı varyant story’leri hem de yan yana karşılaştırma sağlayan `VariantsComparison` story’si bulunmalıdır.

## 3.2. Component props sözleşmeleri

Aşağıdaki içerik `src/types/component-props.ts` dosyasına yazılmalıdır.

```ts
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactElement,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react'

import type {
  AdminPermission,
  AdminRole,
  AuditLogEntry,
  CategoryAttributeDefinition,
  Currency,
  DashboardMetrics,
  ISODate,
  Listing,
  ListingCategory,
  ListingPhoto,
  ListingPromotion,
  ListingReport,
  ListingStatus,
  ModerationEvent,
  Paginated,
  PromotionFlags,
  RejectionReason,
  ReportReason,
  ReportSeverity,
  ReportStatus,
  UserAccount,
  UserStatus,
  UserType,
} from './domain'

export type ControlSize = 'sm' | 'md' | 'lg'
export type AsyncStatus = 'idle' | 'loading' | 'empty' | 'success' | 'error'

export interface UiError {
  title: string
  message: string
  code?: string
  retryable: boolean
}

export type AsyncState<T> =
  | { status: 'idle' | 'loading' }
  | { status: 'empty'; data?: T }
  | { status: 'error'; error: UiError }
  | { status: 'success'; data: T; stale?: boolean }

export interface FieldMetaProps {
  label?: string
  helperText?: string
  error?: string
  required?: boolean
}

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: ControlSize
  loading?: boolean
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  fullWidth?: boolean
}

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'color'
> {
  icon: ReactNode
  label: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: ControlSize
  loading?: boolean
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'solid' | 'soft' | 'outline'
  tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md'
  leadingIcon?: ReactNode
}

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  selected?: boolean
  removable?: boolean
  disabled?: boolean
  onRemove?: () => void
}

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>, FieldMetaProps {
  size?: ControlSize
  leadingIcon?: ReactNode
  trailingAction?: ReactNode
}

export interface SearchInputProps extends InputProps {
  onSearch?: (value: string) => void
  onClear?: () => void
  debounceMs?: number
}

export interface NumberInputProps extends FieldMetaProps {
  value?: number
  min?: number
  max?: number
  step?: number
  size?: ControlSize
  disabled?: boolean
  readOnly?: boolean
  onValueChange?: (value: number | undefined) => void
}

export interface CurrencyInputProps extends FieldMetaProps {
  value?: number
  currency: Currency
  currencies?: Currency[]
  min?: number
  max?: number
  size?: ControlSize
  disabled?: boolean
  onValueChange?: (value: number | undefined) => void
  onCurrencyChange?: (currency: Currency) => void
}

export interface SelectOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export interface SelectProps extends FieldMetaProps {
  value?: string
  options: SelectOption[]
  placeholder?: string
  size?: ControlSize
  disabled?: boolean
  searchable?: boolean
  clearable?: boolean
  loading?: boolean
  onValueChange?: (value: string | undefined) => void
}

export interface MultiSelectProps extends FieldMetaProps {
  values: string[]
  options: SelectOption[]
  placeholder?: string
  size?: ControlSize
  disabled?: boolean
  searchable?: boolean
  loading?: boolean
  maxVisibleTags?: number
  onValuesChange?: (values: string[]) => void
}

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size'
> {
  label: string
  description?: string
  indeterminate?: boolean
}

export interface RadioOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export interface RadioGroupProps extends FieldMetaProps {
  value?: string
  options: RadioOption[]
  orientation?: 'horizontal' | 'vertical'
  disabled?: boolean
  onValueChange?: (value: string) => void
}

export interface SwitchProps {
  checked: boolean
  label: string
  description?: string
  disabled?: boolean
  size?: 'sm' | 'md'
  onCheckedChange?: (checked: boolean) => void
}

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'color'>, FieldMetaProps {
  resize?: 'none' | 'vertical' | 'both'
  showCharacterCount?: boolean
  maxLength?: number
}

export interface DateRange {
  from?: ISODate
  to?: ISODate
}

export interface DateRangePickerProps extends FieldMetaProps {
  value: DateRange
  min?: ISODate
  max?: ISODate
  disabled?: boolean
  presets?: Array<{ label: string; value: DateRange }>
  onValueChange?: (value: DateRange) => void
}

export interface TooltipProps {
  content: ReactNode
  children: ReactElement
  placement?: 'top' | 'right' | 'bottom' | 'left'
  delayMs?: number
  disabled?: boolean
}

export interface AvatarProps {
  src?: string
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  status?: 'online' | 'offline' | 'busy'
}

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  label: string
}

export interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rectangle'
  width?: string
  height?: string
  lines?: number
}

export interface ModalProps {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnBackdrop?: boolean
  onOpenChange: (open: boolean) => void
}

export interface DrawerProps {
  open: boolean
  title: string
  children: ReactNode
  footer?: ReactNode
  side?: 'left' | 'right' | 'bottom'
  size?: 'sm' | 'md' | 'lg'
  onOpenChange: (open: boolean) => void
}

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastProps {
  open: boolean
  title: string
  description?: string
  tone?: 'success' | 'warning' | 'danger' | 'info'
  action?: ToastAction
  durationMs?: number
  onOpenChange: (open: boolean) => void
}

export interface TabItem {
  id: string
  label: string
  badge?: string | number
  disabled?: boolean
  content: ReactNode
}

export interface TabsProps {
  value: string
  items: TabItem[]
  variant?: 'underline' | 'pill' | 'contained'
  orientation?: 'horizontal' | 'vertical'
  onValueChange: (value: string) => void
}

export interface AccordionItem {
  id: string
  title: string
  description?: string
  content: ReactNode
  disabled?: boolean
}

export interface AccordionProps {
  items: AccordionItem[]
  expandedIds: string[]
  allowMultiple?: boolean
  variant?: 'separated' | 'bordered' | 'plain'
  onExpandedIdsChange: (ids: string[]) => void
}

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  label?: string
}

export interface AlertProps {
  tone: 'success' | 'warning' | 'danger' | 'info'
  title: string
  description?: string
  variant?: 'solid' | 'soft' | 'outline'
  action?: ReactNode
  dismissible?: boolean
  onDismiss?: () => void
}

export interface NavigationItem {
  id: string
  label: string
  href: string
  icon: ReactNode
  badge?: number
  requiredPermission?: AdminPermission
  children?: NavigationItem[]
}

export interface SidebarNavProps {
  items: NavigationItem[]
  activeItemId: string
  collapsed?: boolean
  mobileOpen?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  onMobileOpenChange?: (open: boolean) => void
}

export interface TopBarProps {
  title?: string
  searchValue?: string
  currentUser: UserAccount
  notificationsCount?: number
  onSearchChange?: (value: string) => void
  onMenuClick?: () => void
  onProfileClick?: () => void
}

export interface AppShellProps {
  navigation: ReactNode
  topBar: ReactNode
  children: ReactNode
  sidebarMode?: 'fixed' | 'collapsible'
}

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  primaryAction?: ReactNode
  secondaryActions?: ReactNode
  meta?: ReactNode
}

export interface ColumnDef<T> {
  id: string
  header: ReactNode
  accessor?: keyof T
  cell?: (row: T) => ReactNode
  sortable?: boolean
  hideable?: boolean
  width?: string
  align?: 'start' | 'center' | 'end'
}

export interface DataTableProps<T extends { id: string }> {
  rows: T[]
  columns: ColumnDef<T>[]
  rowKey?: (row: T) => string
  density?: 'comfortable' | 'compact'
  visualStyle?: 'plain' | 'bordered' | 'striped'
  mobileMode?: 'scroll' | 'cards'
  loading?: boolean
  error?: UiError
  emptyState?: ReactNode
  selectable?: boolean
  selectedIds?: string[]
  sort?: { columnId: string; direction: 'asc' | 'desc' }
  stickyHeader?: boolean
  onSelectionChange?: (ids: string[]) => void
  onSortChange?: (sort: { columnId: string; direction: 'asc' | 'desc' }) => void
  onRowClick?: (row: T) => void
  renderMobileCard?: (row: T) => ReactNode
}

export type FilterValue = string | number | boolean | string[] | DateRange | null | undefined

export interface FilterDefinition {
  id: string
  label: string
  type: 'text' | 'select' | 'multiSelect' | 'numberRange' | 'dateRange' | 'boolean'
  options?: SelectOption[]
  placeholder?: string
}

export interface FilterBarProps {
  definitions: FilterDefinition[]
  values: Record<string, FilterValue>
  variant?: 'inline' | 'stacked' | 'drawer'
  activeFilterCount?: number
  loading?: boolean
  disabled?: boolean
  savedViewName?: string
  onChange: (id: string, value: FilterValue) => void
  onClear: () => void
  onApply?: () => void
  onSaveView?: (name: string) => void
}

export interface StatusBadgeProps {
  status: ListingStatus
  variant?: 'solid' | 'soft' | 'outline'
  size?: 'sm' | 'md'
  showDot?: boolean
}

export interface ListingCardProps {
  listing: Listing
  variant?: 'compact' | 'detailed' | 'grid'
  selected?: boolean
  flagged?: boolean
  showModerationMeta?: boolean
  actions?: ReactNode
  onClick?: (listing: Listing) => void
  onSelectedChange?: (selected: boolean) => void
}

export interface ModerationCapabilities {
  canApprove: boolean
  canReject: boolean
  canRequestChanges: boolean
  canPause: boolean
  canArchive: boolean
}

export interface ModerationDecisionPayload {
  listingId: string
  expectedRevision: number
  reasons: RejectionReason[]
  note?: string
}

export interface ModerationActionBarProps {
  listingId: string
  status: ListingStatus
  revision: number
  capabilities: ModerationCapabilities
  variant?: 'stickyBottom' | 'inline' | 'sideRail'
  submittingAction?: 'approve' | 'reject' | 'requestChanges' | 'pause' | 'archive'
  onApprove: (payload: ModerationDecisionPayload) => void | Promise<void>
  onReject: (payload: ModerationDecisionPayload) => void | Promise<void>
  onRequestChanges: (payload: ModerationDecisionPayload) => void | Promise<void>
  onPause?: (payload: ModerationDecisionPayload) => void | Promise<void>
  onArchive?: (payload: ModerationDecisionPayload) => void | Promise<void>
}

export interface ImageGalleryProps {
  photos: ListingPhoto[]
  activePhotoId?: string
  variant?: 'mosaic' | 'filmstrip' | 'split'
  loading?: boolean
  allowModeration?: boolean
  onActivePhotoChange?: (photoId: string) => void
  onPhotoApprove?: (photoId: string) => void
  onPhotoReject?: (photoId: string, reason: RejectionReason, note?: string) => void
}

export interface StatCardProps {
  label: string
  value: string | number
  description?: string
  trend?: {
    direction: 'up' | 'down' | 'flat'
    value: string
    sentiment: 'positive' | 'negative' | 'neutral'
  }
  icon?: ReactNode
  variant?: 'plain' | 'accent' | 'trend'
  loading?: boolean
  onClick?: () => void
}

export interface ChartCardProps {
  title: string
  description?: string
  children: ReactNode
  toolbar?: ReactNode
  loading?: boolean
  error?: UiError
  empty?: boolean
  height?: 'sm' | 'md' | 'lg'
}

export interface PaginationProps {
  page: number
  pageSize: number
  totalItems: number
  pageSizeOptions?: number[]
  variant?: 'numbered' | 'compact' | 'loadMore'
  disabled?: boolean
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

export interface RejectionReasonPickerProps {
  value: RejectionReason[]
  note: string
  variant?: 'cards' | 'list' | 'compactSelect'
  required?: boolean
  disabled?: boolean
  error?: string
  onValueChange: (reasons: RejectionReason[]) => void
  onNoteChange: (note: string) => void
}

export interface EmptyStateProps {
  title: string
  description?: string
  illustration?: ReactNode
  primaryAction?: ReactNode
  secondaryAction?: ReactNode
  variant?: 'default' | 'compact' | 'filtered'
}

export interface ErrorStateProps {
  title: string
  description: string
  code?: string
  retryLabel?: string
  variant?: 'page' | 'section' | 'inline'
  onRetry?: () => void
}

export interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  tone?: 'neutral' | 'danger'
  requireText?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export interface BulkActionDefinition {
  id: string
  label: string
  tone?: 'neutral' | 'danger'
  icon?: ReactNode
  disabled?: boolean
}

export interface BulkActionBarProps {
  selectedCount: number
  actions: BulkActionDefinition[]
  variant?: 'floating' | 'sticky' | 'inline'
  loadingActionId?: string
  onAction: (actionId: string) => void
  onClearSelection: () => void
}

export interface RolePermissionMatrixProps {
  roles: AdminRole[]
  permissions: AdminPermission[]
  value: Record<AdminRole, readonly AdminPermission[]>
  variant?: 'editable' | 'readOnly' | 'diff'
  disabled?: boolean
  saving?: boolean
  onChange?: (role: AdminRole, permission: AdminPermission, enabled: boolean) => void
}

export interface CategoryTreeNode {
  id: string
  label: string
  category?: ListingCategory
  children?: CategoryTreeNode[]
  active: boolean
  count?: number
}

export interface CategoryTreeProps {
  nodes: CategoryTreeNode[]
  selectedId?: string
  expandedIds: string[]
  variant?: 'sidebar' | 'panel' | 'compact'
  loading?: boolean
  onSelect: (id: string) => void
  onExpandedIdsChange: (ids: string[]) => void
}

export interface AttributeEditorProps {
  value: Partial<CategoryAttributeDefinition>
  mode: 'create' | 'edit' | 'readOnly'
  dirty?: boolean
  saving?: boolean
  validationErrors?: Record<string, string>
  onChange?: (value: Partial<CategoryAttributeDefinition>) => void
  onSave?: () => void
  onCancel?: () => void
}

export interface UserSummaryCardProps {
  user: UserAccount
  variant?: 'compact' | 'detailed' | 'security'
  actions?: ReactNode
  onClick?: (user: UserAccount) => void
}

export interface ReportCardProps {
  report: ListingReport
  listing?: Listing
  variant?: 'compact' | 'detailed' | 'queue'
  actions?: ReactNode
  onClick?: (report: ListingReport) => void
}

export interface ModerationHistoryProps {
  events: ModerationEvent[]
  variant?: 'timeline' | 'table' | 'compact'
  loading?: boolean
  empty?: boolean
}

export interface ListingFactsProps {
  listing: Listing
  variant?: 'sections' | 'definitionList' | 'comparison'
  previousListing?: Listing
  highlightedFields?: string[]
}

export interface LocationPanelProps {
  listing: Listing
  variant?: 'summary' | 'mapSplit' | 'addressDetail'
  revealExactLocation?: boolean
}

export interface SellerPanelProps {
  user: UserAccount
  listingCount: number
  openReportCount: number
  variant?: 'summary' | 'detailed' | 'risk'
  actions?: ReactNode
}

export interface PromotionFlagsPanelProps {
  flags: PromotionFlags
  promotions: ListingPromotion[]
  editable?: boolean
  variant?: 'badges' | 'cards' | 'table'
  onChange?: (flags: PromotionFlags) => void
}

export interface AutomatedCheckItem {
  id: string
  label: string
  status: 'passed' | 'warning' | 'failed'
  message: string
  score?: number
}

export interface AutomatedChecksPanelProps {
  items: AutomatedCheckItem[]
  variant?: 'list' | 'cards' | 'summary'
  loading?: boolean
}

export interface DashboardStatsProps {
  state: AsyncState<DashboardMetrics>
  dateRange: DateRange
  onDateRangeChange: (value: DateRange) => void
  onMetricClick?: (metricId: string) => void
  onRetry?: () => void
}

export interface ListingFilterValues {
  query?: string
  categories: ListingCategory[]
  statuses: ListingStatus[]
  cityCode?: string
  districtId?: string
  neighborhoodId?: string
  minPrice?: number
  maxPrice?: number
  currencies: Currency[]
  sellerTypes: string[]
  dateRange: DateRange
  promotionTypes: string[]
  reportedOnly?: boolean
  reviewerId?: string
}

export interface ListingListPageProps {
  state: AsyncState<Paginated<Listing>>
  filters: ListingFilterValues
  selectedIds: string[]
  availablePermissions: AdminPermission[]
  onFiltersChange: (filters: ListingFilterValues) => void
  onSelectionChange: (ids: string[]) => void
  onPageChange: (page: number) => void
  onListingOpen: (listing: Listing) => void
  onBulkAction: (actionId: string, ids: string[]) => void
  onRetry: () => void
}

export interface ApprovalQueueProps {
  state: AsyncState<Paginated<Listing>>
  selectedListingId?: string
  lockedListingIds?: string[]
  currentAdminId: string
  capabilities: ModerationCapabilities
  onSelectListing: (listingId: string) => void
  onAssignToSelf: (listingId: string) => void
  onSkip: (listingId: string) => void
  onOpenDetail: (listingId: string) => void
  onRetry: () => void
}

export interface ListingReviewData {
  listing: Listing
  events: ModerationEvent[]
  reports: ListingReport[]
  seller: UserAccount
  previousRevision?: Listing
}

export interface ListingReviewPanelProps {
  state: AsyncState<ListingReviewData>
  capabilities: ModerationCapabilities
  submittingAction?: ModerationActionBarProps['submittingAction']
  onApprove: ModerationActionBarProps['onApprove']
  onReject: ModerationActionBarProps['onReject']
  onRequestChanges: ModerationActionBarProps['onRequestChanges']
  onPause?: ModerationActionBarProps['onPause']
  onArchive?: ModerationActionBarProps['onArchive']
  onRetry: () => void
}

export interface UserFilterValues {
  query?: string
  types: UserType[]
  statuses: UserStatus[]
  roles: AdminRole[]
  verified?: boolean
}

export interface UserManagementPageProps {
  state: AsyncState<Paginated<UserAccount>>
  filters: UserFilterValues
  availablePermissions: AdminPermission[]
  onFiltersChange: (filters: UserFilterValues) => void
  onPageChange: (page: number) => void
  onUserOpen: (user: UserAccount) => void
  onSuspend: (user: UserAccount) => void
  onBan: (user: UserAccount) => void
  onRoleChange: (user: UserAccount, role: AdminRole) => void
  onRetry: () => void
}

export interface UserDetailData {
  user: UserAccount
  listings: Paginated<Listing>
  reports: ListingReport[]
  auditEntries: AuditLogEntry[]
}

export interface UserDetailPageProps {
  state: AsyncState<UserDetailData>
  availablePermissions: AdminPermission[]
  onListingOpen: (listing: Listing) => void
  onSuspend: () => void
  onBan: () => void
  onRoleChange: (role: AdminRole) => void
  onRetry: () => void
}

export interface CategoryAttributePageData {
  tree: CategoryTreeNode[]
  attributes: CategoryAttributeDefinition[]
  selectedNodeId?: string
}

export interface CategoryAttributePageProps {
  state: AsyncState<CategoryAttributePageData>
  editorValue?: Partial<CategoryAttributeDefinition>
  editorMode?: 'create' | 'edit' | 'readOnly'
  dirty?: boolean
  saving?: boolean
  onNodeSelect: (id: string) => void
  onEditorChange: (value: Partial<CategoryAttributeDefinition>) => void
  onSave: () => void
  onPublish: () => void
  onRetry: () => void
}

export interface ReportFilterValues {
  query?: string
  reasons: ReportReason[]
  statuses: ReportStatus[]
  severities: ReportSeverity[]
  assignedAdminId?: string
  dateRange: DateRange
}

export interface ReportManagementPageProps {
  state: AsyncState<Paginated<ListingReport>>
  filters: ReportFilterValues
  onFiltersChange: (filters: ReportFilterValues) => void
  onPageChange: (page: number) => void
  onReportOpen: (report: ListingReport) => void
  onResolve: (report: ListingReport) => void
  onDismiss: (report: ListingReport) => void
  onEscalate: (report: ListingReport) => void
  onRetry: () => void
}

export type ThemeName = 'corporate-blue' | 'neutral-slate' | 'warm-amber'

export interface SettingsPageProps {
  rolePermissions: Record<AdminRole, readonly AdminPermission[]>
  currentTheme: ThemeName
  systemDefaultTheme: ThemeName
  canManagePermissions: boolean
  canManageDefaultTheme: boolean
  saving?: boolean
  dirty?: boolean
  onPermissionChange: (role: AdminRole, permission: AdminPermission, enabled: boolean) => void
  onThemeChange: (theme: ThemeName) => void
  onSystemDefaultThemeChange: (theme: ThemeName) => void
  onSave: () => void
  onReset: () => void
}

export interface AuditLogFilters {
  query?: string
  roles: AdminRole[]
  entityTypes: AuditLogEntry['entityType'][]
  dateRange: DateRange
}

export interface AuditLogPageProps {
  state: AsyncState<Paginated<AuditLogEntry>>
  filters: AuditLogFilters
  onFiltersChange: (filters: AuditLogFilters) => void
  onPageChange: (page: number) => void
  onEntryOpen: (entry: AuditLogEntry) => void
  onRetry: () => void
}

export interface AuthScreenProps {
  mode: 'login' | 'sessionExpired' | 'forbidden' | 'notFound' | 'fatalError'
  loading?: boolean
  error?: string
  onSubmit?: (credentials: { email: string; password: string }) => void
  onPrimaryAction?: () => void
}
```

## 3.3. Design tokens ve primitive componentler

| Component         | Türetildiği ekranlar            | Amaç                                        | Props                  | State’ler                                        | Varyantlar ve zorunlu story’ler                                                                                                 |
| ----------------- | ------------------------------- | ------------------------------------------- | ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `Button`          | Tüm ekranlar                    | Ana ve ikincil eylemler                     | `ButtonProps`          | Default, hover, focus, active, disabled, loading | `Primary`, `Secondary`, `Ghost`, `Danger`, `Small`, `Medium`, `Large`, `FullWidth`, `Loading`, `Disabled`, `VariantsComparison` |
| `IconButton`      | Top bar, tablo, galeri          | Yalnız ikonlu erişilebilir eylem            | `IconButtonProps`      | Default, tooltip, disabled, loading              | Primary, secondary, ghost, danger; sm, md, lg                                                                                   |
| `Badge`           | Dashboard, kullanıcı, rapor     | Genel kısa durum etiketi                    | `BadgeProps`           | Default, icon, long text                         | Solid, soft, outline; semantic tonlar                                                                                           |
| `Tag`             | Filtreler, ilan etiketleri      | Seçilebilir veya kaldırılabilir kısa etiket | `TagProps`             | Default, selected, removable, disabled           | Default, selected, removable                                                                                                    |
| `Input`           | Filtreler, ayarlar, auth        | Tek satır metin girişi                      | `InputProps`           | Empty, filled, focus, error, disabled, read-only | sm, md, lg; leading icon, trailing action                                                                                       |
| `SearchInput`     | Liste ve kullanıcı ekranı       | Arama ve temizleme                          | `SearchInputProps`     | Empty, typing, filled, disabled                  | Default, with result count, mobile full-width                                                                                   |
| `NumberInput`     | Fiyat ve öznitelik              | Sayısal veri girişi                         | `NumberInputProps`     | Empty, filled, min/max error, disabled           | sm, md, lg; stepper görünümü                                                                                                    |
| `CurrencyInput`   | İlan ve filtre                  | Tutar ve para birimini birlikte düzenleme   | `CurrencyInputProps`   | Empty, filled, invalid, disabled                 | Inline currency, split currency selector                                                                                        |
| `Select`          | Tüm filtre ve formlar           | Tekli seçim                                 | `SelectProps`          | Closed, open, loading, empty, error, disabled    | Default, searchable, clearable                                                                                                  |
| `MultiSelect`     | İlan listesi ve raporlar        | Çoklu filtre seçimi                         | `MultiSelectProps`     | Empty, selected, overflow, loading, disabled     | Tags, summary count, searchable                                                                                                 |
| `Checkbox`        | Tablo seçimi, izinler           | İkili veya belirsiz seçim                   | `CheckboxProps`        | Unchecked, checked, indeterminate, disabled      | Label only, description                                                                                                         |
| `RadioGroup`      | Ayarlar, red seçimi             | Tek seçenekli seçim                         | `RadioGroupProps`      | Default, selected, disabled, error               | Horizontal, vertical, cards                                                                                                     |
| `Switch`          | Ayarlar, attribute editor       | Boolean ayar                                | `SwitchProps`          | On, off, disabled                                | sm, md; description                                                                                                             |
| `Textarea`        | Açıklama, red notu              | Çok satırlı metin                           | `TextareaProps`        | Empty, filled, error, disabled, max count        | Default, character count, auto-height                                                                                           |
| `DateRangePicker` | Dashboard ve filtreler          | Tarih aralığı seçimi                        | `DateRangePickerProps` | Empty, selected, invalid range, disabled         | Single panel, preset panel, mobile drawer                                                                                       |
| `Tooltip`         | İkonlar ve kısaltılmış içerik   | Ek açıklama                                 | `TooltipProps`         | Closed, open, delayed, disabled                  | Top, right, bottom, left                                                                                                        |
| `Avatar`          | Top bar, kullanıcı ekranı       | Kullanıcı görseli veya baş harfleri         | `AvatarProps`          | Image, fallback, broken image, status            | sm, md, lg, xl                                                                                                                  |
| `Spinner`         | Lokal işlem durumları           | Kısa süreli yükleme göstergesi              | `SpinnerProps`         | Active                                           | sm, md, lg                                                                                                                      |
| `Skeleton`        | Tüm async ekranlar              | İçerik ölçüsünü koruyan yükleme             | `SkeletonProps`        | Animated, reduced motion                         | Text, circle, rectangle, multiline                                                                                              |
| `Modal`           | Onay ve formlar                 | Odak kilitli dialog                         | `ModalProps`           | Open, closed, long content                       | sm, md, lg, xl                                                                                                                  |
| `Drawer`          | Mobil filtre, audit detayı      | Kenardan açılan panel                       | `DrawerProps`          | Open, closed, scrollable                         | Left, right, bottom; sm, md, lg                                                                                                 |
| `Toast`           | Mutation sonuçları              | Geçici işlem geri bildirimi                 | `ToastProps`           | Open, dismissing, action                         | Success, warning, danger, info                                                                                                  |
| `Tabs`            | Detay ve ayarlar                | Görünüm gruplama                            | `TabsProps`            | Default, selected, disabled, overflow            | Underline, pill, contained; horizontal, vertical                                                                                |
| `Accordion`       | Mobil detay, attribute grupları | Açılır içerik bölümleri                     | `AccordionProps`       | Collapsed, expanded, disabled                    | Separated, bordered, plain                                                                                                      |
| `Divider`         | Form ve detay bölümleri         | Görsel ayırıcı                              | `DividerProps`         | Normal                                           | Horizontal, vertical, label                                                                                                     |
| `Alert`           | Hata, stale veri, uyarı         | Kalıcı veya kapatılabilir mesaj             | `AlertProps`           | Default, dismissible, action                     | Solid, soft, outline; semantic tonlar                                                                                           |

## 3.4. Composite componentler

| Component               | Türetildiği ekranlar          | Amaç                                    | Props                        | State’ler                                            | Varyantlar ve zorunlu story’ler                                                 |
| ----------------------- | ----------------------------- | --------------------------------------- | ---------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| `AppShell`              | Tüm panel                     | Sidebar, top bar ve ana içerik düzeni   | `AppShellProps`              | Default, sidebar collapsed, mobile drawer            | Fixed, collapsible; mobile, tablet, desktop karşılaştırması                     |
| `SidebarNav`            | Tüm panel                     | Yetkiye göre navigasyon                 | `SidebarNavProps`            | Active, nested open, collapsed, mobile open          | Expanded, collapsed, mobile drawer                                              |
| `TopBar`                | Tüm panel                     | Global arama, profil ve bildirim        | `TopBarProps`                | Default, search active, notification count           | Full, compact, mobile                                                           |
| `PageHeader`            | Tüm ekranlar                  | Başlık, breadcrumb ve eylemler          | `PageHeaderProps`            | Default, long title, actions overflow                | Basic, with meta, with actions                                                  |
| `DataTable`             | İlan, kullanıcı, rapor, audit | Sıralama, seçim ve yoğun veri gösterimi | `DataTableProps<T>`          | Loading, empty, error, selected, sorted              | Comfortable, compact; plain, bordered, striped; mobile cards, horizontal scroll |
| `FilterBar`             | Tüm liste ekranları           | Filtreleri yönetme                      | `FilterBarProps`             | Empty, active, loading, disabled                     | Inline, stacked, drawer, `VariantsComparison`                                   |
| `StatusBadge`           | İlan ekranları                | Listing durumunu tutarlı gösterme       | `StatusBadgeProps`           | Tüm status değerleri                                 | Solid, soft, outline, all statuses comparison                                   |
| `ListingCard`           | Liste, kuyruk, dashboard      | İlan özeti                              | `ListingCardProps`           | Default, selected, flagged, no photo, long title     | Compact, detailed, grid, `VariantsComparison`                                   |
| `ModerationActionBar`   | Kuyruk ve detay               | Onay, red ve düzeltme kararları         | `ModerationActionBarProps`   | Default, no permission, submitting, conflict         | Sticky bottom, inline, side rail                                                |
| `ImageGallery`          | İlan detay                    | Fotoğraf inceleme ve görsel moderasyonu | `ImageGalleryProps`          | Loading, empty, active, rejected image, broken image | Mosaic, filmstrip, split                                                        |
| `StatCard`              | Dashboard                     | KPI gösterimi                           | `StatCardProps`              | Loading, positive trend, negative trend, no trend    | Plain, accent, trend                                                            |
| `ChartCard`             | Dashboard                     | Grafik kabı                             | `ChartCardProps`             | Loading, empty, error, success                       | sm, md, lg height; toolbar/no toolbar                                           |
| `Pagination`            | Liste ekranları               | Sayfalama                               | `PaginationProps`            | First, middle, last, disabled                        | Numbered, compact, load more                                                    |
| `RejectionReasonPicker` | Kuyruk ve detay               | Gerekçe ve not toplama                  | `RejectionReasonPickerProps` | Empty, selected, error, disabled                     | Cards, list, compact select                                                     |
| `EmptyState`            | Tüm ekranlar                  | Boş veri veya filtre sonucu             | `EmptyStateProps`            | Default                                              | Default, compact, filtered                                                      |
| `ErrorState`            | Tüm ekranlar                  | Hata ve retry                           | `ErrorStateProps`            | Retryable, non-retryable                             | Page, section, inline                                                           |
| `ConfirmDialog`         | Kritik eylemler               | Geri döndürülemez işlem doğrulama       | `ConfirmDialogProps`         | Default, loading, typed confirmation                 | Neutral, danger                                                                 |
| `BulkActionBar`         | İlan ve rapor listesi         | Seçili kayıt eylemleri                  | `BulkActionBarProps`         | Selected, action loading, disabled action            | Floating, sticky, inline                                                        |
| `RolePermissionMatrix`  | Ayarlar, kullanıcı            | Rol-izin karşılaştırması                | `RolePermissionMatrixProps`  | Default, saving, disabled, changed cells             | Editable, read-only, diff                                                       |
| `CategoryTree`          | Kategori yönetimi             | Kategori hiyerarşisi                    | `CategoryTreeProps`          | Loading, empty, selected, expanded                   | Sidebar, panel, compact                                                         |
| `AttributeEditor`       | Kategori yönetimi             | Öznitelik tanımlama                     | `AttributeEditorProps`       | Create, edit, read-only, dirty, saving, errors       | Create, edit, read-only                                                         |
| `UserSummaryCard`       | Kullanıcı ve ilan detay       | Kullanıcı özeti                         | `UserSummaryCardProps`       | Active, suspended, banned, unverified                | Compact, detailed, security                                                     |
| `ReportCard`            | Rapor listesi ve detay        | Şikayet özeti                           | `ReportCardProps`            | Open, in review, resolved, critical                  | Compact, detailed, queue                                                        |
| `ModerationHistory`     | İlan detay                    | Moderasyon olaylarını gösterme          | `ModerationHistoryProps`     | Loading, empty, success                              | Timeline, table, compact                                                        |
| `ListingFacts`          | İlan detay                    | Kategoriye göre alanları gösterme       | `ListingFactsProps`          | Normal, missing optional values, changed fields      | Sections, definition list, comparison                                           |
| `LocationPanel`         | İlan detay                    | Konum ve koordinat özeti                | `LocationPanelProps`         | Exact hidden, exact visible, no coordinates          | Summary, map split, address detail                                              |
| `SellerPanel`           | İlan ve kullanıcı detay       | İlan sahibi ve risk özeti               | `SellerPanelProps`           | Verified, unverified, suspended, risky               | Summary, detailed, risk                                                         |
| `PromotionFlagsPanel`   | İlan liste ve detay           | Doping görünürlüğü                      | `PromotionFlagsPanelProps`   | None, active, scheduled, expired                     | Badges, cards, table                                                            |
| `AutomatedChecksPanel`  | Kuyruk ve detay               | Otomatik kalite kontrolleri             | `AutomatedChecksPanelProps`  | Loading, all passed, warnings, failed                | List, cards, summary                                                            |

## 3.5. Screen-level composition componentleri

| Component               | Amaç                                                          | Props                        | Zorunlu state story’leri                                                         | Zorunlu düzen varyantları                        |
| ----------------------- | ------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------ |
| `DashboardStats`        | Dashboard verisini kart ve grafiklere dönüştürmek             | `DashboardStatsProps`        | Loading, Empty, Error, PartialSuccess, Success, Stale                            | Mobile stack, tablet grid, desktop grid          |
| `ListingListPage`       | Filtre, tablo, seçim ve toplu işlemleri birleştirmek          | `ListingListPageProps`       | Loading, Empty, FilteredEmpty, Error, Success, BulkSelected, Unauthorized        | Mobile cards, tablet scroll table, desktop table |
| `ApprovalQueue`         | Moderasyon kuyruğunu ve hızlı karar akışını birleştirmek      | `ApprovalQueueProps`         | Loading, Empty, Error, Success, Locked, Conflict                                 | Single column, split view, wide queue            |
| `ListingReviewPanel`    | İlanın tüm inceleme alanlarını ve karar çubuğunu birleştirmek | `ListingReviewPanelProps`    | Loading, Error, NotFound, Success, DecisionPending, Conflict                     | Mobile sections, desktop split, wide side rail   |
| `UserManagementPage`    | Kullanıcı liste, filtre ve yaptırımlarını birleştirmek        | `UserManagementPageProps`    | Loading, Empty, FilteredEmpty, Error, Success, RoleRestricted                    | Mobile cards, desktop table                      |
| `UserDetailPage`        | Kullanıcı özeti, ilanları, raporları ve audit’i birleştirmek  | `UserDetailPageProps`        | Loading, Error, Success, Suspended, Banned                                       | Mobile tabs, desktop columns                     |
| `CategoryAttributePage` | Kategori ağacı ve attribute editor’ü birleştirmek             | `CategoryAttributePageProps` | Loading, Empty, Error, Success, Dirty, Saving, Conflict                          | Mobile drill-down, desktop split                 |
| `ReportManagementPage`  | Şikayet filtre, liste ve çözüm eylemlerini birleştirmek       | `ReportManagementPageProps`  | Loading, Empty, FilteredEmpty, Error, Success, CriticalReports                   | Mobile queue cards, desktop table                |
| `SettingsPage`          | Tema ve rol izinlerini birleştirmek                           | `SettingsPageProps`          | Loading, Success, Dirty, Saving, Unauthorized                                    | Read-only, editable, permission diff             |
| `AuditLogPage`          | Audit filtreleme ve detay incelemesini birleştirmek           | `AuditLogPageProps`          | Loading, Empty, Error, Success, Unauthorized                                     | Mobile cards, desktop table                      |
| `AuthScreen`            | Giriş ve erişim durumlarını göstermek                         | `AuthScreenProps`            | Login, LoginLoading, LoginError, SessionExpired, Forbidden, NotFound, FatalError | Centered card, split brand panel                 |

## 3.6. Çoklu varyantların seçilebilirliği

Kritik componentlerin Storybook’ta yalnızca ayrı story’leri bulunmamalıdır. Aşağıdaki iki karşılaştırma modeli birlikte uygulanmalıdır:

1. `VariantsComparison`: Tüm görsel veya yapısal varyantları aynı canvas üzerinde yan yana gösterir.
2. Controls: `variant`, `size`, `density`, `visualStyle` ve `status` alanları Storybook controls üzerinden değiştirilebilir.

En az aşağıdaki componentlerde `VariantsComparison` zorunludur:

- `Button`
- `Badge`
- `StatusBadge`
- `FilterBar`
- `DataTable`
- `ListingCard`
- `ModerationActionBar`
- `ImageGallery`
- `StatCard`
- `RejectionReasonPicker`
- `RolePermissionMatrix`
- `AppShell`

# ADIM 4 — DESIGN TOKEN & GEÇİCİ PALET

## 4.1. Token kuralları

- Hex, RGB, HSL veya named color yalnızca token dosyasında bulunabilir.
- Component CSS dosyalarında renk değeri değil, yalnızca `var(--token-name)` kullanılmalıdır.
- Component CSS dosyalarında sabit spacing, radius, shadow ve font size kullanılmamalıdır.
- Küçük metin için en düşük değer `1rem` olmalıdır.
- Birincil dolu butonda `primary-700` üstünde beyaz metin kullanılmalıdır.
- Soft status varyantlarında açık arka plan ve en az `700` koyuluğunda metin kullanılmalıdır.
- Focus durumu yalnız renk değişimiyle anlatılmamalı; görünür ring bulunmalıdır.
- `prefers-reduced-motion` desteklenmelidir.
- Renk tek başına durum göstergesi olmamalı; metin, ikon veya nokta ile desteklenmelidir.
- Paletler Storybook toolbar üzerinden anında değiştirilebilir olmalıdır.

## 4.2. `src/tokens/tokens.css`

```css
:root {
  color-scheme: light;

  --font-family-sans:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-family-mono: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;

  --font-size-sm: 1rem;
  --font-size-md: 1.0625rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;

  --line-height-tight: 1.25;
  --line-height-heading: 1.35;
  --line-height-body: 1.5;
  --line-height-relaxed: 1.65;

  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --space-0: 0;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;
  --space-24: 6rem;

  --radius-none: 0;
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  --radius-full: 9999px;

  --shadow-xs: 0 1px 2px rgb(15 23 42 / 0.06);
  --shadow-sm: 0 1px 3px rgb(15 23 42 / 0.1), 0 1px 2px rgb(15 23 42 / 0.06);
  --shadow-md: 0 4px 6px -1px rgb(15 23 42 / 0.1), 0 2px 4px -2px rgb(15 23 42 / 0.08);
  --shadow-lg: 0 10px 15px -3px rgb(15 23 42 / 0.12), 0 4px 6px -4px rgb(15 23 42 / 0.08);
  --shadow-xl: 0 20px 25px -5px rgb(15 23 42 / 0.14), 0 8px 10px -6px rgb(15 23 42 / 0.08);

  --z-base: 0;
  --z-sticky: 100;
  --z-dropdown: 300;
  --z-drawer: 500;
  --z-modal: 700;
  --z-toast: 900;
  --z-tooltip: 1000;

  --duration-fast: 120ms;
  --duration-normal: 180ms;
  --duration-slow: 260ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-emphasized: cubic-bezier(0.2, 0, 0, 1.2);

  --control-height-sm: 2.75rem;
  --control-height-md: 3rem;
  --control-height-lg: 3.5rem;
  --control-inline-padding-sm: var(--space-3);
  --control-inline-padding-md: var(--space-4);
  --control-inline-padding-lg: var(--space-5);

  --container-sm: 40rem;
  --container-md: 48rem;
  --container-lg: 64rem;
  --container-xl: 80rem;
  --container-2xl: 96rem;
}

:root,
[data-theme='corporate-blue'] {
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f8fafc;
  --color-neutral-100: #f1f5f9;
  --color-neutral-200: #e2e8f0;
  --color-neutral-300: #cbd5e1;
  --color-neutral-400: #94a3b8;
  --color-neutral-500: #64748b;
  --color-neutral-600: #475569;
  --color-neutral-700: #334155;
  --color-neutral-800: #1e293b;
  --color-neutral-900: #0f172a;

  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;

  --color-success-50: #f0fdf4;
  --color-success-100: #dcfce7;
  --color-success-600: #16a34a;
  --color-success-700: #15803d;
  --color-success-800: #166534;
  --color-success-900: #14532d;

  --color-warning-50: #fffbeb;
  --color-warning-100: #fef3c7;
  --color-warning-600: #d97706;
  --color-warning-700: #b45309;
  --color-warning-800: #92400e;
  --color-warning-900: #78350f;

  --color-danger-50: #fef2f2;
  --color-danger-100: #fee2e2;
  --color-danger-600: #dc2626;
  --color-danger-700: #b91c1c;
  --color-danger-800: #991b1b;
  --color-danger-900: #7f1d1d;

  --color-info-50: #f0f9ff;
  --color-info-100: #e0f2fe;
  --color-info-600: #0284c7;
  --color-info-700: #0369a1;
  --color-info-800: #075985;
  --color-info-900: #0c4a6e;

  --color-bg-canvas: var(--color-neutral-50);
  --color-bg-surface: var(--color-neutral-0);
  --color-bg-subtle: var(--color-neutral-100);
  --color-bg-elevated: var(--color-neutral-0);
  --color-bg-disabled: var(--color-neutral-200);
  --color-bg-overlay: rgb(15 23 42 / 0.58);

  --color-text-primary: var(--color-neutral-900);
  --color-text-secondary: var(--color-neutral-700);
  --color-text-muted: var(--color-neutral-600);
  --color-text-disabled: var(--color-neutral-500);
  --color-text-inverse: var(--color-neutral-0);
  --color-text-link: var(--color-primary-700);
  --color-text-link-hover: var(--color-primary-900);

  --color-border-default: var(--color-neutral-300);
  --color-border-strong: var(--color-neutral-500);
  --color-border-subtle: var(--color-neutral-200);

  --color-action-primary-bg: var(--color-primary-700);
  --color-action-primary-hover: var(--color-primary-800);
  --color-action-primary-active: var(--color-primary-900);
  --color-action-primary-text: var(--color-neutral-0);

  --color-action-secondary-bg: var(--color-neutral-0);
  --color-action-secondary-hover: var(--color-neutral-100);
  --color-action-secondary-active: var(--color-neutral-200);
  --color-action-secondary-text: var(--color-neutral-900);
  --color-action-secondary-border: var(--color-neutral-400);

  --color-action-ghost-hover: var(--color-neutral-100);
  --color-action-ghost-active: var(--color-neutral-200);
  --color-action-ghost-text: var(--color-neutral-800);

  --color-action-danger-bg: var(--color-danger-700);
  --color-action-danger-hover: var(--color-danger-800);
  --color-action-danger-active: var(--color-danger-900);
  --color-action-danger-text: var(--color-neutral-0);

  --color-focus-ring: var(--color-primary-500);
  --color-selection-bg: var(--color-primary-100);
  --color-table-row-hover: var(--color-neutral-100);

  --color-status-draft-bg: var(--color-neutral-100);
  --color-status-draft-text: var(--color-neutral-800);
  --color-status-draft-border: var(--color-neutral-400);

  --color-status-pending-bg: var(--color-warning-50);
  --color-status-pending-text: var(--color-warning-800);
  --color-status-pending-border: var(--color-warning-600);

  --color-status-changes-bg: var(--color-info-50);
  --color-status-changes-text: var(--color-info-800);
  --color-status-changes-border: var(--color-info-600);

  --color-status-published-bg: var(--color-success-50);
  --color-status-published-text: var(--color-success-800);
  --color-status-published-border: var(--color-success-600);

  --color-status-rejected-bg: var(--color-danger-50);
  --color-status-rejected-text: var(--color-danger-800);
  --color-status-rejected-border: var(--color-danger-600);

  --color-status-paused-bg: var(--color-info-50);
  --color-status-paused-text: var(--color-info-900);
  --color-status-paused-border: var(--color-info-700);

  --color-status-expired-bg: var(--color-neutral-100);
  --color-status-expired-text: var(--color-neutral-700);
  --color-status-expired-border: var(--color-neutral-400);

  --color-status-archived-bg: var(--color-neutral-200);
  --color-status-archived-text: var(--color-neutral-900);
  --color-status-archived-border: var(--color-neutral-500);
}

[data-theme='neutral-slate'] {
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f8fafc;
  --color-neutral-100: #f1f5f9;
  --color-neutral-200: #e2e8f0;
  --color-neutral-300: #cbd5e1;
  --color-neutral-400: #94a3b8;
  --color-neutral-500: #64748b;
  --color-neutral-600: #475569;
  --color-neutral-700: #334155;
  --color-neutral-800: #1e293b;
  --color-neutral-900: #0f172a;

  --color-primary-50: #f8fafc;
  --color-primary-100: #f1f5f9;
  --color-primary-200: #e2e8f0;
  --color-primary-300: #cbd5e1;
  --color-primary-400: #94a3b8;
  --color-primary-500: #64748b;
  --color-primary-600: #475569;
  --color-primary-700: #334155;
  --color-primary-800: #1e293b;
  --color-primary-900: #0f172a;
}

[data-theme='warm-amber'] {
  --color-neutral-0: #ffffff;
  --color-neutral-50: #fafaf9;
  --color-neutral-100: #f5f5f4;
  --color-neutral-200: #e7e5e4;
  --color-neutral-300: #d6d3d1;
  --color-neutral-400: #a8a29e;
  --color-neutral-500: #78716c;
  --color-neutral-600: #57534e;
  --color-neutral-700: #44403c;
  --color-neutral-800: #292524;
  --color-neutral-900: #1c1917;

  --color-primary-50: #fffbeb;
  --color-primary-100: #fef3c7;
  --color-primary-200: #fde68a;
  --color-primary-300: #fcd34d;
  --color-primary-400: #fbbf24;
  --color-primary-500: #f59e0b;
  --color-primary-600: #d97706;
  --color-primary-700: #b45309;
  --color-primary-800: #92400e;
  --color-primary-900: #78350f;
}
```

## 4.3. `src/tokens/globals.css`

```css
@import './tokens.css';

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  min-width: 20rem;
  font-family: var(--font-family-sans);
  font-size: 100%;
  color: var(--color-text-primary);
  background: var(--color-bg-canvas);
}

body {
  min-width: 20rem;
  min-height: 100vh;
  margin: 0;
  font-size: var(--font-size-sm);
  line-height: var(--line-height-body);
  color: var(--color-text-primary);
  background: var(--color-bg-canvas);
  text-rendering: optimizeLegibility;
}

button,
input,
select,
textarea {
  font: inherit;
}

button,
a,
input,
select,
textarea,
[tabindex]:not([tabindex='-1']) {
  -webkit-tap-highlight-color: transparent;
}

button:not(:disabled),
a[href],
input:not(:disabled),
select:not(:disabled),
textarea:not(:disabled) {
  touch-action: manipulation;
}

img,
svg {
  display: block;
  max-width: 100%;
}

a {
  color: var(--color-text-link);
  text-underline-offset: var(--space-1);
}

a:hover {
  color: var(--color-text-link-hover);
}

:focus-visible {
  outline: 0.1875rem solid var(--color-focus-ring);
  outline-offset: 0.125rem;
}

::selection {
  background: var(--color-selection-bg);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 4.4. Component içinde token kullanım örneği

`src/components/primitives/Button/Button.module.css`:

```css
.root {
  min-height: var(--control-height-md);
  padding-inline: var(--control-inline-padding-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard),
    color var(--duration-fast) var(--ease-standard),
    box-shadow var(--duration-fast) var(--ease-standard);
}

.root[data-size='sm'] {
  min-height: var(--control-height-sm);
  padding-inline: var(--control-inline-padding-sm);
}

.root[data-size='lg'] {
  min-height: var(--control-height-lg);
  padding-inline: var(--control-inline-padding-lg);
}

.root[data-variant='primary'] {
  color: var(--color-action-primary-text);
  background: var(--color-action-primary-bg);
}

.root[data-variant='primary']:hover:not(:disabled) {
  background: var(--color-action-primary-hover);
}

.root[data-variant='primary']:active:not(:disabled) {
  background: var(--color-action-primary-active);
}

.root[data-variant='secondary'] {
  color: var(--color-action-secondary-text);
  background: var(--color-action-secondary-bg);
  border-color: var(--color-action-secondary-border);
}

.root[data-variant='secondary']:hover:not(:disabled) {
  background: var(--color-action-secondary-hover);
}

.root[data-variant='ghost'] {
  color: var(--color-action-ghost-text);
  background: transparent;
}

.root[data-variant='ghost']:hover:not(:disabled) {
  background: var(--color-action-ghost-hover);
}

.root[data-variant='danger'] {
  color: var(--color-action-danger-text);
  background: var(--color-action-danger-bg);
}

.root[data-variant='danger']:hover:not(:disabled) {
  background: var(--color-action-danger-hover);
}

.root:disabled {
  color: var(--color-text-disabled);
  background: var(--color-bg-disabled);
  border-color: var(--color-border-subtle);
  cursor: not-allowed;
  opacity: 1;
}
```

## 4.5. Storybook toolbar tema geçişi

`.storybook/preview.ts`:

```ts
import type { Decorator, Preview } from '@storybook/react-vite'

import '../src/tokens/globals.css'

type ThemeName = 'corporate-blue' | 'neutral-slate' | 'warm-amber'

const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals.theme ?? 'corporate-blue') as ThemeName

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = theme
  }

  return Story()
}

const preview: Preview = {
  globalTypes: {
    theme: {
      name: 'Tema',
      description: 'Geçici design token paleti',
      defaultValue: 'corporate-blue',
      toolbar: {
        icon: 'paintbrush',
        dynamicTitle: true,
        items: [
          {
            value: 'corporate-blue',
            title: 'Kurumsal Mavi',
          },
          {
            value: 'neutral-slate',
            title: 'Nötr Slate',
          },
          {
            value: 'warm-amber',
            title: 'Sıcak Amber',
          },
        ],
      },
    },
  },

  decorators: [withTheme],

  parameters: {
    layout: 'centered',

    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    viewport: {
      viewports: {
        mobileSmall: {
          name: 'Mobil 320',
          styles: {
            width: '320px',
            height: '800px',
          },
        },
        mobileLarge: {
          name: 'Mobil 430',
          styles: {
            width: '430px',
            height: '900px',
          },
        },
        tablet: {
          name: 'Tablet 768',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop 1440',
          styles: {
            width: '1440px',
            height: '1000px',
          },
        },
      },
    },

    options: {
      storySort: {
        order: ['Foundations', 'Primitives', 'Composites', 'Screens', 'Patterns'],
      },
    },
  },
}

export default preview
```

## 4.6. Tema doğrulama koşulları

- Her story üç temada render edilmelidir.
- Kritik componentlerin visual regression testleri üç tema için alınmalıdır.
- `primary-700` üstünde beyaz metin, semantic soft arka plan üstünde semantic `800` metin kullanılmalıdır.
- Normal metin ve arka plan kombinasyonları WCAG AA seviyesinde olmalıdır.
- `axe` raporunda renk kontrastı ihlali kabul edilmemelidir.
- Tema değişiminde sayfa reload gerekmemelidir.
- Tema adı `document.documentElement.dataset.theme` üzerinden yönetilmelidir.
- Kullanıcının tema tercihi uygulama katmanında saklanmalı; componentler storage erişimi yapmamalıdır.

# ADIM 5 — ÇIKTI FORMATI (Claude Code için)

## 5.1. Proje bağlamı ve değişmez uygulama kararları

- Ürün yalnızca gayrimenkul dikeyine odaklanan sahibinden.com benzeri bir admin panelidir.
- Son kullanıcı ilan sitesi bu kapsamda değildir.
- Kapsam:
  - İlan yönetimi.
  - Moderasyon ve onay.
  - Kullanıcı yönetimi.
  - Şikayet yönetimi.
  - Kategori ve öznitelik yönetimi.
  - Dashboard ve istatistikler.
  - Roller, izinler ve tema ayarları.
  - Audit log.
- Runtime:
  - React 19.
  - TypeScript strict mode.
  - Vite.
  - Storybook için `@storybook/react-vite`.
  - CSF3.
- Storybook 9 hedef alınmalıdır. Kullanılan CSF3 component story yapısı Storybook 8.6 ile de uyumlu tutulmalıdır.
- Componentlerin içinde veri çekme kodu bulunmamalıdır.
- İlk üretilecek çıktı çalışan Storybook component kütüphanesidir; gerçek backend entegrasyonu yapılmayacaktır.
- Görünür metin boyutu en az `1rem` olmalıdır.
- Kod mobil-first yazılmalıdır.
- Kritik componentler çok varyantlı olmalıdır.
- Renkler yalnız token dosyasından gelmelidir.
- `src/types/domain.ts` için Adım 1.5’teki kod doğrudan kullanılmalıdır.
- `src/types/component-props.ts` için Adım 3.2’deki kod doğrudan kullanılmalıdır.

## 5.2. Fixture ve mock-data rehberi

### Fixture prensipleri

- Fixture’lar `Listing` union tipine `satisfies` veya açık tip atamasıyla bağlanmalıdır.
- `as any`, `as unknown as` veya gevşek obje kullanılmamalıdır.
- Her ana kategori için en az iki fixture bulunmalıdır.
- Her `ListingStatus` için en az bir fixture bulunmalıdır.
- Tüm telefonlar sentetik `555` numaraları olmalıdır.
- Tüm e-postalar `.invalid` alan adını kullanmalıdır.
- Tarihler sabit olmalı; `new Date()` ile story sonucunu değiştiren veri üretilmemelidir.
- Fotoğraflar ağ bağlantısına bağımlı olmamalıdır.
- `public/fixtures/listings` altında fixture görselleri oluşturulmalıdır.
- Liste fixture sırası sabit olmalıdır.
- Dashboard serileri en az 30 gün içermelidir.
- Story içinde rastgele veri üretilmemelidir.

### Kategori ve status fixture matrisi

| Fixture                            | Kategori                    | Durum              |
| ---------------------------------- | --------------------------- | ------------------ |
| `residentialPublishedApartment`    | Konut / Daire               | `published`        |
| `residentialPendingVilla`          | Konut / Villa               | `pendingReview`    |
| `landDraftResidentialZoned`        | Arsa / Konut İmarlı         | `draft`            |
| `landRejectedField`                | Arsa / Tarla                | `rejected`         |
| `commercialChangesRequestedOffice` | İşyeri / Ofis               | `changesRequested` |
| `commercialPausedWarehouse`        | İşyeri / Depo ve Antrepo    | `paused`           |
| `buildingExpiredComplete`          | Bina / Komple Bina          | `expired`          |
| `buildingArchivedMixedUse`         | Bina / Komple Bina          | `archived`         |
| `timesharePublishedBodrum`         | Devremülk                   | `published`        |
| `timesharePendingThermal`          | Devremülk                   | `pendingReview`    |
| `tourismPublishedBoutiqueHotel`    | Turistik Tesis / Butik Otel | `published`        |
| `tourismRejectedPension`           | Turistik Tesis / Pansiyon   | `rejected`         |

### `src/fixtures/listings.ts`

```ts
import {
  AssetModerationStatus,
  AutomatedCheckCode,
  AutomatedCheckResultStatus,
  BuildingAge,
  BuildingCondition,
  BuildingSubCategory,
  BuildingTransactionType,
  BuildingUsageType,
  CommercialSubCategory,
  CommercialTransactionType,
  Currency,
  HeatingType,
  InfrastructureType,
  LandSubCategory,
  LandTransactionType,
  ListingCategory,
  ListingSource,
  ListingStatus,
  LoanEligibility,
  OccupancyStatus,
  ParkingType,
  PricePeriod,
  PromotionStatus,
  PromotionType,
  RejectionReason,
  ResidentialSubCategory,
  ResidentialTransactionType,
  SellerType,
  SellerVerificationStatus,
  TimeshareSeason,
  TimeshareSubCategory,
  TimeshareTransactionType,
  TitleDeedStatus,
  TourismFacilitySubCategory,
  TourismFacilityTransactionType,
  ZoningStatus,
  type BuildingListing,
  type CommercialListing,
  type LandListing,
  type Listing,
  type ListingBase,
  type ListingPhoto,
  type Location,
  type ModerationSummary,
  type ResidentialListing,
  type SellerSummary,
  type TimeshareListing,
  type TourismFacilityListing,
} from '../types/domain'

const ownerSeller: SellerSummary = {
  id: 'seller-owner-ayse-demir',
  type: SellerType.Owner,
  displayName: 'Ayşe Demir',
  verificationStatus: SellerVerificationStatus.Verified,
}

const officeSeller: SellerSummary = {
  id: 'seller-office-marmara-emlak',
  type: SellerType.RealEstateOffice,
  displayName: 'Marmara Emlak Danışmanlığı',
  companyName: 'Marmara Emlak Danışmanlık Ltd. Şti.',
  verificationStatus: SellerVerificationStatus.Verified,
}

const constructionSeller: SellerSummary = {
  id: 'seller-construction-yapi-proje',
  type: SellerType.ConstructionCompany,
  displayName: 'Yapı Proje Gayrimenkul',
  companyName: 'Yapı Proje İnşaat A.Ş.',
  verificationStatus: SellerVerificationStatus.Verified,
}

function createLocation(
  cityCode: string,
  cityName: string,
  districtId: string,
  districtName: string,
  neighborhoodId: string,
  neighborhoodName: string,
  latitude: number,
  longitude: number,
): Location {
  return {
    countryCode: 'TR',
    cityCode,
    cityName,
    districtId,
    districtName,
    neighborhoodId,
    neighborhoodName,
    coordinates: {
      latitude,
      longitude,
    },
    showExactLocation: false,
  }
}

function createPhoto(listingKey: string, order: number, altText: string): ListingPhoto {
  return {
    id: `${listingKey}-photo-${order}`,
    url: `/fixtures/listings/${listingKey}-${order}.webp`,
    thumbnailUrl: `/fixtures/listings/${listingKey}-${order}-thumb.webp`,
    altText,
    order,
    isCover: order === 1,
    width: 1600,
    height: 1067,
    mimeType: 'image/webp',
    moderationStatus: AssetModerationStatus.Approved,
  }
}

function createModeration(
  status: ListingStatus,
  overrides: Partial<ModerationSummary> = {},
): ModerationSummary {
  const defaultSummary: ModerationSummary = {
    rejectionReasons: [],
    automatedChecks: [
      {
        code: AutomatedCheckCode.RequiredFields,
        status: AutomatedCheckResultStatus.Passed,
        message: 'Zorunlu alanlar tamamlandı.',
        checkedAt: '2026-07-14T09:00:00+03:00',
      },
      {
        code: AutomatedCheckCode.ContactInfoDetection,
        status: AutomatedCheckResultStatus.Passed,
        message: 'Açıklamada harici iletişim bilgisi bulunmadı.',
        checkedAt: '2026-07-14T09:00:02+03:00',
      },
      {
        code: AutomatedCheckCode.ImageQuality,
        status: AutomatedCheckResultStatus.Passed,
        score: 0.92,
        message: 'Fotoğrafların çözünürlüğü yeterli.',
        checkedAt: '2026-07-14T09:00:04+03:00',
      },
    ],
  }

  if (status === ListingStatus.PendingReview) {
    defaultSummary.submittedAt = '2026-07-14T09:05:00+03:00'
    defaultSummary.currentReviewerId = 'admin-content-reviewer-1'
  }

  if (status === ListingStatus.Published) {
    defaultSummary.submittedAt = '2026-07-10T11:30:00+03:00'
    defaultSummary.lastReviewedAt = '2026-07-10T12:05:00+03:00'
    defaultSummary.reviewNote = 'İlan alanları ve görseller uygun.'
  }

  if (status === ListingStatus.ChangesRequested) {
    defaultSummary.submittedAt = '2026-07-13T10:00:00+03:00'
    defaultSummary.lastReviewedAt = '2026-07-13T10:24:00+03:00'
    defaultSummary.rejectionReasons = [RejectionReason.MisleadingOrIncompleteInfo]
    defaultSummary.reviewNote =
      'Net m² bilgisi ile açıklamadaki değer uyuşmuyor; açıklama güncellenmeli.'
  }

  if (status === ListingStatus.Rejected) {
    defaultSummary.submittedAt = '2026-07-12T14:00:00+03:00'
    defaultSummary.lastReviewedAt = '2026-07-12T14:18:00+03:00'
    defaultSummary.rejectionReasons = [RejectionReason.DuplicateListing]
    defaultSummary.reviewNote = 'Aynı gayrimenkule ait aktif bir ilan bulundu.'
  }

  return {
    ...defaultSummary,
    ...overrides,
  }
}

interface BaseFixtureArgs {
  id: string
  listingNo: string
  title: string
  description: string
  status: ListingStatus
  priceAmount: number
  currency?: Currency
  pricePeriod: PricePeriod
  location: Location
  seller: SellerSummary
  ownerUserId: string
  createdAt: string
  updatedAt: string
  publishedAt?: string
  expiresAt?: string
  tags?: string[]
  viewCount?: number
  favoriteCount?: number
  reportCount?: number
  promotionTypes?: PromotionType[]
  moderation?: ModerationSummary
}

function createBaseListing(args: BaseFixtureArgs): ListingBase {
  const promotionTypes = args.promotionTypes ?? []

  return {
    id: args.id,
    listingNo: args.listingNo,
    title: args.title,
    description: args.description,
    status: args.status,
    price: {
      amount: args.priceAmount,
      currency: args.currency ?? Currency.Try,
      period: args.pricePeriod,
      negotiable: true,
    },
    location: args.location,
    photos: [
      createPhoto(args.id, 1, `${args.title} kapak görünümü`),
      createPhoto(args.id, 2, `${args.title} iç mekan veya arazi görünümü`),
    ],
    listingDate: args.createdAt,
    createdAt: args.createdAt,
    updatedAt: args.updatedAt,
    submittedAt: args.moderation?.submittedAt ?? createModeration(args.status).submittedAt,
    publishedAt: args.publishedAt,
    expiresAt: args.expiresAt,
    ownerUserId: args.ownerUserId,
    seller: args.seller,
    contact: {
      phone: args.seller.type === SellerType.Owner ? '+90 555 000 11 22' : '+90 212 555 01 40',
      email:
        args.seller.type === SellerType.Owner
          ? 'ayse.demir@example.invalid'
          : 'ilan@example.invalid',
      allowPhone: true,
      allowMessage: true,
      preferredContactMethod: 'both',
    },
    promotionFlags: {
      oneCikan: promotionTypes.includes(PromotionType.Featured),
      acil: promotionTypes.includes(PromotionType.Urgent),
      vitrin: promotionTypes.includes(PromotionType.Showcase),
      anasayfaVitrini: promotionTypes.includes(PromotionType.HomepageShowcase),
      kategoriOneCikan: promotionTypes.includes(PromotionType.CategoryFeatured),
    },
    promotions: promotionTypes.map((type, index) => ({
      id: `${args.id}-promotion-${index + 1}`,
      type,
      status: PromotionStatus.Active,
      purchasedAt: '2026-07-10T09:00:00+03:00',
      startsAt: '2026-07-10T09:00:00+03:00',
      endsAt: '2026-07-24T09:00:00+03:00',
      source: 'paid',
    })),
    moderation: args.moderation ?? createModeration(args.status),
    metrics: {
      viewCount: args.viewCount ?? 0,
      favoriteCount: args.favoriteCount ?? 0,
      messageCount: Math.floor((args.favoriteCount ?? 0) / 3),
      reportCount: args.reportCount ?? 0,
    },
    source: ListingSource.Web,
    revision: 1,
    tags: args.tags ?? [],
  }
}

export const residentialPublishedApartment: ResidentialListing = {
  ...createBaseListing({
    id: 'listing-residential-kadikoy-apartment',
    listingNo: '1245789630',
    title: "Caferağa'da Asansörlü Binada Ferah 3+1 Daire",
    description:
      "Kadıköy Caferağa Mahallesi'nde, toplu ulaşıma yakın, çift cepheli ve yenilenmiş 3+1 daire. Salon ve odalar gün ışığı almaktadır. Binada asansör ve kapalı otopark bulunmaktadır.",
    status: ListingStatus.Published,
    priceAmount: 18_750_000,
    pricePeriod: PricePeriod.OneTime,
    location: createLocation(
      '34',
      'İstanbul',
      'kadikoy',
      'Kadıköy',
      'caferaga',
      'Caferağa',
      40.9888,
      29.0277,
    ),
    seller: officeSeller,
    ownerUserId: 'user-office-marmara-emlak',
    createdAt: '2026-07-10T10:45:00+03:00',
    updatedAt: '2026-07-10T12:05:00+03:00',
    publishedAt: '2026-07-10T12:05:00+03:00',
    expiresAt: '2026-08-09T12:05:00+03:00',
    tags: ['yüksekDeğer', 'kadıköy'],
    viewCount: 1_842,
    favoriteCount: 126,
    reportCount: 0,
    promotionTypes: [PromotionType.Featured, PromotionType.CategoryFeatured],
  }),
  category: ListingCategory.Residential,
  transactionType: ResidentialTransactionType.Sale,
  subCategory: ResidentialSubCategory.Apartment,
  attributes: {
    grossSquareMeters: 145,
    netSquareMeters: 128,
    roomCount: '3+1',
    buildingAge: BuildingAge.ElevenToFifteen,
    floorLocation: '4',
    floorCount: 7,
    heatingType: HeatingType.NaturalGasCombi,
    bathroomCount: 2,
    hasBalcony: true,
    hasElevator: true,
    parkingType: ParkingType.Closed,
    furnished: false,
    occupancyStatus: OccupancyStatus.Vacant,
    inComplex: false,
    monthlyFee: {
      amount: 1_850,
      currency: Currency.Try,
      period: PricePeriod.Monthly,
      negotiable: false,
    },
    loanEligibility: LoanEligibility.Eligible,
    titleDeedStatus: TitleDeedStatus.Condominium,
    swapAccepted: false,
  },
}

export const residentialPendingVilla: ResidentialListing = {
  ...createBaseListing({
    id: 'listing-residential-konyaalti-villa',
    listingNo: '1245790148',
    title: "Konyaaltı'nda Havuzlu ve Eşyalı Müstakil Villa",
    description:
      "Konyaaltı Hurma Mahallesi'nde, özel havuzlu, bahçeli ve tam eşyalı villa. Uzun dönem kiralamaya uygundur.",
    status: ListingStatus.PendingReview,
    priceAmount: 65_000,
    pricePeriod: PricePeriod.Monthly,
    location: createLocation(
      '07',
      'Antalya',
      'konyaalti',
      'Konyaaltı',
      'hurma',
      'Hurma',
      36.8589,
      30.6089,
    ),
    seller: ownerSeller,
    ownerUserId: 'user-owner-ayse-demir',
    createdAt: '2026-07-14T08:42:00+03:00',
    updatedAt: '2026-07-14T09:05:00+03:00',
    tags: ['yeniBaşvuru'],
  }),
  category: ListingCategory.Residential,
  transactionType: ResidentialTransactionType.Rent,
  subCategory: ResidentialSubCategory.Villa,
  attributes: {
    grossSquareMeters: 280,
    netSquareMeters: 240,
    roomCount: '5+1',
    buildingAge: BuildingAge.OneToFive,
    floorLocation: 'mustakil',
    floorCount: 2,
    heatingType: HeatingType.Underfloor,
    bathroomCount: 4,
    hasBalcony: true,
    hasElevator: false,
    parkingType: ParkingType.Open,
    furnished: true,
    occupancyStatus: OccupancyStatus.Vacant,
    inComplex: false,
    monthlyFee: {
      amount: 0,
      currency: Currency.Try,
      period: PricePeriod.Monthly,
      negotiable: false,
    },
    loanEligibility: LoanEligibility.Unknown,
    titleDeedStatus: TitleDeedStatus.Condominium,
    swapAccepted: false,
  },
}

export const landDraftResidentialZoned: LandListing = {
  ...createBaseListing({
    id: 'listing-land-urla-residential',
    listingNo: '1245791041',
    title: "Urla Kuşçular'da Konut İmarlı 550 m² Arsa",
    description:
      "Kuşçular Mahallesi'nde yola cepheli, elektrik ve su altyapısı bulunan konut imarlı arsa.",
    status: ListingStatus.Draft,
    priceAmount: 9_900_000,
    pricePeriod: PricePeriod.OneTime,
    location: createLocation(
      '35',
      'İzmir',
      'urla',
      'Urla',
      'kuscular',
      'Kuşçular',
      38.2933,
      26.6903,
    ),
    seller: ownerSeller,
    ownerUserId: 'user-owner-ayse-demir',
    createdAt: '2026-07-15T15:10:00+03:00',
    updatedAt: '2026-07-15T15:10:00+03:00',
    tags: ['taslak'],
  }),
  category: ListingCategory.Land,
  transactionType: LandTransactionType.Sale,
  subCategory: LandSubCategory.ResidentialZoned,
  attributes: {
    squareMeters: 550,
    zoningStatus: ZoningStatus.Residential,
    block: '112',
    parcel: '8',
    mapSheet: 'L18-C-12-A',
    floorAreaRatio: 0.4,
    maxBuildingHeightMeters: 6.5,
    pricePerSquareMeter: {
      amount: 18_000,
      currency: Currency.Try,
      period: PricePeriod.OneTime,
      negotiable: true,
    },
    roadFrontageMeters: 21,
    infrastructure: [
      InfrastructureType.Electricity,
      InfrastructureType.Water,
      InfrastructureType.Road,
    ],
  },
}

export const landRejectedField: LandListing = {
  ...createBaseListing({
    id: 'listing-land-corlu-field',
    listingNo: '1245791558',
    title: "Çorlu'da Sanayi Bölgesine Yakın 12.450 m² Tarla",
    description:
      'Ana yola yakın, tek tapu tarla. Aynı taşınmaz için daha önce açılan aktif kayıt nedeniyle ilan tekrar incelemeye alınmıştır.',
    status: ListingStatus.Rejected,
    priceAmount: 23_000_000,
    pricePeriod: PricePeriod.OneTime,
    location: createLocation(
      '59',
      'Tekirdağ',
      'corlu',
      'Çorlu',
      'turkgucu',
      'Türkgücü',
      41.1546,
      27.8064,
    ),
    seller: officeSeller,
    ownerUserId: 'user-office-marmara-emlak',
    createdAt: '2026-07-12T13:40:00+03:00',
    updatedAt: '2026-07-12T14:18:00+03:00',
    reportCount: 1,
    tags: ['mükerrerRisk'],
    moderation: createModeration(ListingStatus.Rejected, {
      rejectionReasons: [RejectionReason.DuplicateListing],
      reviewNote: '1245700021 numaralı aktif ilanla aynı ada, parsel ve fotoğraflar kullanılmış.',
    }),
  }),
  category: ListingCategory.Land,
  transactionType: LandTransactionType.Sale,
  subCategory: LandSubCategory.Field,
  attributes: {
    squareMeters: 12_450,
    zoningStatus: ZoningStatus.Field,
    block: '246',
    parcel: '19',
    pricePerSquareMeter: {
      amount: 1_847.39,
      currency: Currency.Try,
      period: PricePeriod.OneTime,
      negotiable: true,
    },
    roadFrontageMeters: 86,
    infrastructure: [InfrastructureType.Electricity, InfrastructureType.Road],
  },
}

export const commercialChangesRequestedOffice: CommercialListing = {
  ...createBaseListing({
    id: 'listing-commercial-sisli-office',
    listingNo: '1245792010',
    title: "Şişli Merkez'de Metroya Yakın 180 m² Kiralık Ofis",
    description:
      'Şişli merkezde açık plan çalışma alanı, toplantı odası ve mutfak bulunan kiralık ofis.',
    status: ListingStatus.ChangesRequested,
    priceAmount: 95_000,
    pricePeriod: PricePeriod.Monthly,
    location: createLocation(
      '34',
      'İstanbul',
      'sisli',
      'Şişli',
      'merkez',
      'Merkez',
      41.0603,
      28.9877,
    ),
    seller: officeSeller,
    ownerUserId: 'user-office-marmara-emlak',
    createdAt: '2026-07-13T09:40:00+03:00',
    updatedAt: '2026-07-13T10:24:00+03:00',
    tags: ['düzeltmeBekliyor'],
  }),
  category: ListingCategory.Commercial,
  transactionType: CommercialTransactionType.Rent,
  subCategory: CommercialSubCategory.Office,
  attributes: {
    squareMeters: 180,
    roomCount: 'acikPlan',
    floorCount: 8,
    floorLocation: '5',
    heatingType: HeatingType.Central,
    deposit: {
      amount: 190_000,
      currency: Currency.Try,
      period: PricePeriod.OneTime,
      negotiable: false,
    },
    buildingCondition: BuildingCondition.Used,
    hasElevator: true,
    parkingType: ParkingType.Closed,
    furnished: false,
    monthlyFee: {
      amount: 8_500,
      currency: Currency.Try,
      period: PricePeriod.Monthly,
      negotiable: false,
    },
    occupancyStatus: OccupancyStatus.Vacant,
  },
}

export const commercialPausedWarehouse: CommercialListing = {
  ...createBaseListing({
    id: 'listing-commercial-gebze-warehouse',
    listingNo: '1245792454',
    title: 'Gebze OSB Yakınında 2.400 m² Lojistik Deposu',
    description:
      'Tır girişine uygun, yüksek tavanlı, yangın sistemi ve yükleme rampaları bulunan depo.',
    status: ListingStatus.Paused,
    priceAmount: 420_000,
    pricePeriod: PricePeriod.Monthly,
    location: createLocation(
      '41',
      'Kocaeli',
      'gebze',
      'Gebze',
      'balcik',
      'Balçık',
      40.8642,
      29.4929,
    ),
    seller: constructionSeller,
    ownerUserId: 'user-construction-yapi-proje',
    createdAt: '2026-06-18T11:00:00+03:00',
    updatedAt: '2026-07-11T16:20:00+03:00',
    publishedAt: '2026-06-18T12:30:00+03:00',
    expiresAt: '2026-07-18T12:30:00+03:00',
    viewCount: 784,
    favoriteCount: 31,
    tags: ['geçiciPasif'],
  }),
  category: ListingCategory.Commercial,
  transactionType: CommercialTransactionType.Rent,
  subCategory: CommercialSubCategory.Warehouse,
  attributes: {
    squareMeters: 2_400,
    roomCount: 'acikPlan',
    floorCount: 1,
    floorLocation: 'zeminKat',
    heatingType: HeatingType.None,
    deposit: {
      amount: 840_000,
      currency: Currency.Try,
      period: PricePeriod.OneTime,
      negotiable: true,
    },
    buildingCondition: BuildingCondition.Used,
    hasElevator: false,
    parkingType: ParkingType.Open,
    furnished: false,
    occupancyStatus: OccupancyStatus.Vacant,
  },
}

export const buildingExpiredComplete: BuildingListing = {
  ...createBaseListing({
    id: 'listing-building-cankaya-complete',
    listingNo: '1245793008',
    title: "Çankaya'da 14 Bağımsız Bölümlü Komple Bina",
    description: 'Konut ve ofis kullanımına uygun, düzenli kira getirisi bulunan komple bina.',
    status: ListingStatus.Expired,
    priceAmount: 85_000_000,
    pricePeriod: PricePeriod.OneTime,
    location: createLocation(
      '06',
      'Ankara',
      'cankaya',
      'Çankaya',
      'gaziosmanpasa',
      'Gaziosmanpaşa',
      39.8988,
      32.8633,
    ),
    seller: officeSeller,
    ownerUserId: 'user-office-marmara-emlak',
    createdAt: '2026-06-10T09:00:00+03:00',
    updatedAt: '2026-07-10T09:00:00+03:00',
    publishedAt: '2026-06-10T10:15:00+03:00',
    expiresAt: '2026-07-10T10:15:00+03:00',
    viewCount: 2_410,
    favoriteCount: 98,
    tags: ['süresiDolmuş'],
  }),
  category: ListingCategory.Building,
  transactionType: BuildingTransactionType.Sale,
  subCategory: BuildingSubCategory.CompleteBuilding,
  attributes: {
    totalSquareMeters: 1_100,
    netSquareMeters: 960,
    buildingAge: BuildingAge.SixToTen,
    floorCount: 7,
    independentUnitCount: 14,
    hasOccupancyPermit: true,
    hasElevator: true,
    parkingType: ParkingType.Closed,
    heatingType: HeatingType.Central,
    usageType: BuildingUsageType.Mixed,
    monthlyRentalIncome: {
      amount: 420_000,
      currency: Currency.Try,
      period: PricePeriod.Monthly,
      negotiable: false,
    },
    titleDeedStatus: TitleDeedStatus.Condominium,
    swapAccepted: false,
  },
}

export const buildingArchivedMixedUse: BuildingListing = {
  ...createBaseListing({
    id: 'listing-building-osmangazi-archived',
    listingNo: '1245793411',
    title: "Osmangazi'de Cadde Üzeri Karma Kullanımlı Komple Bina",
    description: 'Zemin katta mağaza, üst katlarda ofis ve konut birimleri bulunan komple bina.',
    status: ListingStatus.Archived,
    priceAmount: 45_000_000,
    pricePeriod: PricePeriod.OneTime,
    location: createLocation(
      '16',
      'Bursa',
      'osmangazi',
      'Osmangazi',
      'altiparmak',
      'Altıparmak',
      40.1944,
      29.0551,
    ),
    seller: ownerSeller,
    ownerUserId: 'user-owner-ayse-demir',
    createdAt: '2026-05-03T10:30:00+03:00',
    updatedAt: '2026-07-01T13:12:00+03:00',
    publishedAt: '2026-05-03T12:00:00+03:00',
    expiresAt: '2026-06-02T12:00:00+03:00',
    viewCount: 3_201,
    favoriteCount: 144,
    tags: ['satıldı', 'arşiv'],
  }),
  category: ListingCategory.Building,
  transactionType: BuildingTransactionType.Sale,
  subCategory: BuildingSubCategory.CompleteBuilding,
  attributes: {
    totalSquareMeters: 650,
    netSquareMeters: 580,
    buildingAge: BuildingAge.SixteenToTwenty,
    floorCount: 5,
    independentUnitCount: 9,
    hasOccupancyPermit: true,
    hasElevator: true,
    parkingType: ParkingType.None,
    heatingType: HeatingType.NaturalGasCombi,
    usageType: BuildingUsageType.Mixed,
    monthlyRentalIncome: {
      amount: 260_000,
      currency: Currency.Try,
      period: PricePeriod.Monthly,
      negotiable: false,
    },
    titleDeedStatus: TitleDeedStatus.Condominium,
    swapAccepted: false,
  },
}

export const timesharePublishedBodrum: TimeshareListing = {
  ...createBaseListing({
    id: 'listing-timeshare-bodrum-summer',
    listingNo: '1245793892',
    title: "Bodrum'da Temmuz Dönemi 14 Günlük 2+1 Devremülk",
    description:
      'Denize yürüme mesafesinde, havuzlu tesiste her yıl temmuz döneminde 14 gün kullanım hakkı.',
    status: ListingStatus.Published,
    priceAmount: 1_650_000,
    pricePeriod: PricePeriod.OneTime,
    location: createLocation(
      '48',
      'Muğla',
      'bodrum',
      'Bodrum',
      'gumbet',
      'Gümbet',
      37.0323,
      27.4029,
    ),
    seller: ownerSeller,
    ownerUserId: 'user-owner-ayse-demir',
    createdAt: '2026-07-08T12:10:00+03:00',
    updatedAt: '2026-07-08T13:05:00+03:00',
    publishedAt: '2026-07-08T13:05:00+03:00',
    expiresAt: '2026-08-07T13:05:00+03:00',
    viewCount: 521,
    favoriteCount: 38,
    promotionTypes: [PromotionType.Urgent],
  }),
  category: ListingCategory.Timeshare,
  transactionType: TimeshareTransactionType.Sale,
  subCategory: TimeshareSubCategory.Timeshare,
  attributes: {
    facilityName: 'Bodrum Mavi Tatil Evleri',
    squareMeters: 84,
    roomCount: '2+1',
    usagePeriod: '10 Temmuz - 24 Temmuz',
    usageDays: 14,
    season: TimeshareSeason.Summer,
    annualMaintenanceFee: {
      amount: 18_500,
      currency: Currency.Try,
      period: PricePeriod.Yearly,
      negotiable: false,
    },
    titleDeedStatus: TitleDeedStatus.Condominium,
    exchangeProgram: 'Uluslararası tesis değişim programı',
    furnished: true,
  },
}

export const timesharePendingThermal: TimeshareListing = {
  ...createBaseListing({
    id: 'listing-timeshare-afyon-thermal',
    listingNo: '1245794107',
    title: 'Afyon Termal Tesiste Kış Dönemi 7 Günlük Devremülk',
    description:
      'Termal havuz ve aile banyolarına erişim sağlayan, her yıl şubat ayında 7 günlük kullanım hakkı.',
    status: ListingStatus.PendingReview,
    priceAmount: 480_000,
    pricePeriod: PricePeriod.OneTime,
    location: createLocation(
      '03',
      'Afyonkarahisar',
      'merkez',
      'Merkez',
      'gazligol',
      'Gazlıgöl',
      38.8756,
      30.5162,
    ),
    seller: officeSeller,
    ownerUserId: 'user-office-marmara-emlak',
    createdAt: '2026-07-14T16:20:00+03:00',
    updatedAt: '2026-07-14T16:45:00+03:00',
    tags: ['termal', 'yeniBaşvuru'],
  }),
  category: ListingCategory.Timeshare,
  transactionType: TimeshareTransactionType.Sale,
  subCategory: TimeshareSubCategory.Timeshare,
  attributes: {
    facilityName: 'Gazlıgöl Termal Yaşam Merkezi',
    squareMeters: 58,
    roomCount: '1+1',
    usagePeriod: 'Şubat ayının ikinci haftası',
    usageDays: 7,
    season: TimeshareSeason.Winter,
    annualMaintenanceFee: {
      amount: 9_750,
      currency: Currency.Try,
      period: PricePeriod.Yearly,
      negotiable: false,
    },
    titleDeedStatus: TitleDeedStatus.Shared,
    furnished: true,
  },
}

export const tourismPublishedBoutiqueHotel: TourismFacilityListing = {
  ...createBaseListing({
    id: 'listing-tourism-kemer-boutique-hotel',
    listingNo: '1245794559',
    title: "Kemer'de Faaliyette 28 Odalı Butik Otel",
    description:
      'Sahile 250 metre mesafede, işletme ve alkol ruhsatı bulunan, faal durumdaki butik otel.',
    status: ListingStatus.Published,
    priceAmount: 120_000_000,
    pricePeriod: PricePeriod.OneTime,
    location: createLocation(
      '07',
      'Antalya',
      'kemer',
      'Kemer',
      'merkez',
      'Merkez',
      36.6005,
      30.5595,
    ),
    seller: constructionSeller,
    ownerUserId: 'user-construction-yapi-proje',
    createdAt: '2026-07-05T09:30:00+03:00',
    updatedAt: '2026-07-05T11:10:00+03:00',
    publishedAt: '2026-07-05T11:10:00+03:00',
    expiresAt: '2026-08-04T11:10:00+03:00',
    viewCount: 936,
    favoriteCount: 46,
    promotionTypes: [PromotionType.Showcase, PromotionType.HomepageShowcase],
  }),
  category: ListingCategory.TourismFacility,
  transactionType: TourismFacilityTransactionType.Sale,
  subCategory: TourismFacilitySubCategory.BoutiqueHotel,
  attributes: {
    roomCount: 28,
    bedCount: 64,
    starRating: 4,
    floorCount: 4,
    indoorSquareMeters: 2_100,
    outdoorSquareMeters: 1_350,
    buildingAge: BuildingAge.SixToTen,
    hasOperatingLicense: true,
    hasAlcoholLicense: true,
    distanceToBeachMeters: 250,
    buildingCondition: BuildingCondition.Used,
    furnished: true,
    parkingType: ParkingType.Open,
    transferIncluded: true,
    annualRevenue: {
      amount: 24_500_000,
      currency: Currency.Try,
      period: PricePeriod.Yearly,
      negotiable: false,
    },
  },
}

export const tourismRejectedPension: TourismFacilityListing = {
  ...createBaseListing({
    id: 'listing-tourism-marmaris-pension',
    listingNo: '1245795024',
    title: "Marmaris Merkez'de 16 Odalı Pansiyon",
    description:
      'Merkezi konumda 16 odalı turistik tesis. Ruhsat bilgileri için moderasyon incelemesi yapılmıştır.',
    status: ListingStatus.Rejected,
    priceAmount: 48_000_000,
    pricePeriod: PricePeriod.OneTime,
    location: createLocation(
      '48',
      'Muğla',
      'marmaris',
      'Marmaris',
      'tepe',
      'Tepe',
      36.855,
      28.2742,
    ),
    seller: officeSeller,
    ownerUserId: 'user-office-marmara-emlak',
    createdAt: '2026-07-12T16:00:00+03:00',
    updatedAt: '2026-07-12T16:42:00+03:00',
    reportCount: 2,
    tags: ['belgeKontrolü'],
    moderation: createModeration(ListingStatus.Rejected, {
      rejectionReasons: [
        RejectionReason.MissingAuthorizationDocument,
        RejectionReason.DocumentMismatch,
      ],
      reviewNote:
        'Yüklenen işletme belgesi farklı ada ait. Yetki ve ruhsat belgeleri doğrulanamadı.',
    }),
  }),
  category: ListingCategory.TourismFacility,
  transactionType: TourismFacilityTransactionType.Sale,
  subCategory: TourismFacilitySubCategory.Pension,
  attributes: {
    roomCount: 16,
    bedCount: 34,
    floorCount: 3,
    indoorSquareMeters: 980,
    outdoorSquareMeters: 240,
    buildingAge: BuildingAge.ElevenToFifteen,
    hasOperatingLicense: false,
    hasAlcoholLicense: false,
    distanceToBeachMeters: 620,
    buildingCondition: BuildingCondition.Used,
    furnished: true,
    parkingType: ParkingType.None,
    transferIncluded: false,
  },
}

export const allListingFixtures: Listing[] = [
  residentialPublishedApartment,
  residentialPendingVilla,
  landDraftResidentialZoned,
  landRejectedField,
  commercialChangesRequestedOffice,
  commercialPausedWarehouse,
  buildingExpiredComplete,
  buildingArchivedMixedUse,
  timesharePublishedBodrum,
  timesharePendingThermal,
  tourismPublishedBoutiqueHotel,
  tourismRejectedPension,
]

export const listingByStatus = {
  [ListingStatus.Draft]: landDraftResidentialZoned,
  [ListingStatus.PendingReview]: residentialPendingVilla,
  [ListingStatus.ChangesRequested]: commercialChangesRequestedOffice,
  [ListingStatus.Published]: residentialPublishedApartment,
  [ListingStatus.Rejected]: landRejectedField,
  [ListingStatus.Paused]: commercialPausedWarehouse,
  [ListingStatus.Expired]: buildingExpiredComplete,
  [ListingStatus.Archived]: buildingArchivedMixedUse,
} satisfies Record<ListingStatus, Listing>
```

### Ek fixture setleri

`src/fixtures/users.ts` içinde en az şu kayıtlar bulunmalıdır:

- Bir aktif bireysel ilan sahibi.
- Bir doğrulanmış emlak ofisi.
- Bir doğrulanmış inşaat firması.
- Bir askıya alınmış kullanıcı.
- Bir banlı kullanıcı.
- Dört admin kullanıcısı; her `AdminRole` için bir kullanıcı.

`src/fixtures/reports.ts` içinde en az şu kayıtlar bulunmalıdır:

- `open`, düşük şiddet.
- `open`, kritik sahte ilan şüphesi.
- `inReview`.
- `resolved`.
- `dismissed`.
- Aynı ilana bağlı üç rapor.
- Arşivlenmiş ilana bağlı rapor.

`src/fixtures/dashboard.ts` içinde:

- 30 günlük yeni ilan serisi.
- 30 günlük moderasyon serisi.
- Altı ana kategori için dağılım.
- Bekleyen ilan sayısı: `37`.
- Bugünkü yeni ilan sayısı: `128`.
- Red oranı: `0.083`.
- Ortalama inceleme süresi: `14.6` dakika.
- Açık rapor sayısı: `19`.

## 5.3. Önerilen dosya ve klasör yapısı

```text
.
├── .storybook/
│   ├── main.ts
│   ├── preview.ts
│   └── manager.ts
├── public/
│   └── fixtures/
│       ├── avatars/
│       └── listings/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── AppProviders.tsx
│   │   └── routes.tsx
│   ├── domain/
│   │   ├── listingTransitions.ts
│   │   ├── listingValidation.ts
│   │   ├── permissions.ts
│   │   └── labels.ts
│   ├── types/
│   │   ├── domain.ts
│   │   └── component-props.ts
│   ├── tokens/
│   │   ├── tokens.css
│   │   ├── globals.css
│   │   └── themes.ts
│   ├── components/
│   │   ├── primitives/
│   │   │   ├── Accordion/
│   │   │   ├── Alert/
│   │   │   ├── Avatar/
│   │   │   ├── Badge/
│   │   │   ├── Button/
│   │   │   ├── Checkbox/
│   │   │   ├── CurrencyInput/
│   │   │   ├── DateRangePicker/
│   │   │   ├── Divider/
│   │   │   ├── Drawer/
│   │   │   ├── IconButton/
│   │   │   ├── Input/
│   │   │   ├── Modal/
│   │   │   ├── MultiSelect/
│   │   │   ├── NumberInput/
│   │   │   ├── RadioGroup/
│   │   │   ├── SearchInput/
│   │   │   ├── Select/
│   │   │   ├── Skeleton/
│   │   │   ├── Spinner/
│   │   │   ├── Switch/
│   │   │   ├── Tabs/
│   │   │   ├── Tag/
│   │   │   ├── Textarea/
│   │   │   ├── Toast/
│   │   │   └── Tooltip/
│   │   └── composites/
│   │       ├── AppShell/
│   │       ├── AttributeEditor/
│   │       ├── AutomatedChecksPanel/
│   │       ├── BulkActionBar/
│   │       ├── CategoryTree/
│   │       ├── ChartCard/
│   │       ├── ConfirmDialog/
│   │       ├── DataTable/
│   │       ├── EmptyState/
│   │       ├── ErrorState/
│   │       ├── FilterBar/
│   │       ├── ImageGallery/
│   │       ├── ListingCard/
│   │       ├── ListingFacts/
│   │       ├── LocationPanel/
│   │       ├── ModerationActionBar/
│   │       ├── ModerationHistory/
│   │       ├── PageHeader/
│   │       ├── Pagination/
│   │       ├── PromotionFlagsPanel/
│   │       ├── RejectionReasonPicker/
│   │       ├── ReportCard/
│   │       ├── RolePermissionMatrix/
│   │       ├── SellerPanel/
│   │       ├── SidebarNav/
│   │       ├── StatCard/
│   │       ├── StatusBadge/
│   │       ├── TopBar/
│   │       └── UserSummaryCard/
│   ├── screens/
│   │   ├── ApprovalQueue/
│   │   ├── AuditLogPage/
│   │   ├── AuthScreen/
│   │   ├── CategoryAttributePage/
│   │   ├── DashboardStats/
│   │   ├── ListingListPage/
│   │   ├── ListingReviewPanel/
│   │   ├── ReportManagementPage/
│   │   ├── SettingsPage/
│   │   ├── UserDetailPage/
│   │   └── UserManagementPage/
│   ├── fixtures/
│   │   ├── dashboard.ts
│   │   ├── listings.ts
│   │   ├── moderationEvents.ts
│   │   ├── reports.ts
│   │   ├── users.ts
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useControllableState.ts
│   │   ├── useMediaQuery.ts
│   │   └── usePermissions.ts
│   ├── utils/
│   │   ├── formatCurrency.ts
│   │   ├── formatDate.ts
│   │   ├── formatListingAttribute.ts
│   │   └── invariant.ts
│   ├── main.tsx
│   └── vite-env.d.ts
├── eslint.config.js
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

Her component klasörü şu yapıyı kullanmalıdır:

```text
Button/
├── Button.tsx
├── Button.module.css
├── Button.stories.tsx
├── Button.test.tsx
└── index.ts
```

## 5.4. Fazlı uygulama planı

### Faz 1 — Tokens ve primitives

Uygulama sırası:

1. React 19, Vite, TypeScript ve Storybook yapılandırması.
2. `domain.ts` ve `component-props.ts`.
3. Token dosyaları ve üç tema.
4. Storybook toolbar theme switcher.
5. Global reset ve erişilebilir focus davranışı.
6. `Button`, `IconButton`, `Badge`, `Tag`.
7. `Input`, `SearchInput`, `NumberInput`, `CurrencyInput`.
8. `Select`, `MultiSelect`, `Checkbox`, `RadioGroup`, `Switch`.
9. `Textarea`, `DateRangePicker`.
10. `Tooltip`, `Avatar`, `Spinner`, `Skeleton`.
11. `Modal`, `Drawer`, `Toast`.
12. `Tabs`, `Accordion`, `Divider`, `Alert`.
13. Her primitive için CSF3 story, autodocs, state ve varyant karşılaştırması.
14. Klavye ve axe kontrolleri.

Faz 1 tamamlanma kapısı:

- Üç tema çalışıyor.
- Primitives sabit renk içermiyor.
- Tüm kontroller klavyeyle erişilebilir.
- Tüm görünen metinler en az `1rem`.
- Tüm önemli varyantlar Storybook’ta görülebilir.

### Faz 2 — Composites

Uygulama sırası:

1. `StatusBadge`, `StatCard`, `ChartCard`.
2. `EmptyState`, `ErrorState`, `ConfirmDialog`.
3. `Pagination`, `FilterBar`, `BulkActionBar`.
4. Generic `DataTable`.
5. `ListingCard`.
6. `RejectionReasonPicker`.
7. `ModerationActionBar`.
8. `ImageGallery`.
9. `ListingFacts`, `LocationPanel`, `SellerPanel`.
10. `PromotionFlagsPanel`, `AutomatedChecksPanel`.
11. `ModerationHistory`.
12. `UserSummaryCard`, `ReportCard`.
13. `CategoryTree`, `AttributeEditor`.
14. `RolePermissionMatrix`.
15. `SidebarNav`, `TopBar`, `PageHeader`, `AppShell`.
16. Mobil, tablet ve desktop story’leri.
17. Her kritik composite için `VariantsComparison`.

Faz 2 tamamlanma kapısı:

- Composites yalnız typed props ve fixture verisi kullanıyor.
- Ağ isteği yapılmıyor.
- Loading, empty, error, disabled ve success story’leri bulunuyor.
- Kritik componentler en az üç belirgin varyant sağlıyor.
- Mobil düzenler 320 piksel genişlikte taşma üretmiyor.

### Faz 3 — Screen compositions

Uygulama sırası:

1. `DashboardStats`.
2. `ListingListPage`.
3. `ApprovalQueue`.
4. `ListingReviewPanel`.
5. `UserManagementPage`.
6. `UserDetailPage`.
7. `CategoryAttributePage`.
8. `ReportManagementPage`.
9. `SettingsPage`.
10. `AuditLogPage`.
11. `AuthScreen`.
12. Her ekran için loading, empty, error, success ve yetki varyantları.
13. Her ekran için 320, 430, 768 ve 1440 piksel viewport story’leri.
14. Moderasyon ve toplu işlem akışları için interaction testleri.

Faz 3 tamamlanma kapısı:

- Ekran componentleri fixture verisiyle uçtan uca render oluyor.
- Rol bazlı eylem görünürlüğü doğru.
- Durum makinesinde geçersiz eylem sunulmuyor.
- Mutation pending, success ve error davranışları görsel olarak test edilebiliyor.
- Tüm ekranlar üç temada çalışıyor.

## 5.5. Storybook story gereksinimleri

### Genel CSF3 standardı

Her story dosyası:

- `Meta` ve `StoryObj` tiplerini kullanmalıdır.
- `satisfies Meta<typeof Component>` kullanmalıdır.
- `tags: ["autodocs"]` içermelidir.
- Ortak callback’ler için `fn()` kullanmalıdır.
- Değiştirilebilir props için `args` sağlamalıdır.
- Enum ve union props için açık `argTypes` tanımlamalıdır.
- Her varyant ayrı story olmalıdır.
- Her async veya etkileşim state’i ayrı story olmalıdır.
- Kritik componentlerde `VariantsComparison` story’si bulunmalıdır.
- Mobil story’lerde `parameters.viewport.defaultViewport` kullanılmalıdır.
- Screen story’lerinde `layout: "fullscreen"` kullanılmalıdır.
- Rastgele veya zamana bağlı fixture kullanılmamalıdır.
- `play` fonksiyonlarında gerçek kullanıcı etkileşimine yakın sorgular kullanılmalıdır.
- Yalnız CSS ile üretilen hover state’i story adı olarak tek başına yeterli sayılmamalıdır; focus, disabled ve loading ayrıca gösterilmelidir.

### Kısa CSF3 örneği

`src/components/primitives/Button/Button.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { Button } from './Button'

const meta = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],

  args: {
    children: 'İlanı kaydet',
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    fullWidth: false,
    onClick: fn(),
  },

  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
    },
    loading: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    fullWidth: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

export const Primary: Story = {}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Vazgeç',
  },
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Detayı aç',
  },
}

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'İlanı reddet',
  },
}

export const Loading: Story = {
  args: {
    loading: true,
    children: 'Kaydediliyor',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const FullWidthMobile: Story = {
  args: {
    fullWidth: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobileSmall',
    },
  },
}

export const VariantsComparison: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gap: 'var(--space-4)',
        minWidth: 'min(100%, 42rem)',
      }}
    >
      <Button variant="primary">Birincil</Button>
      <Button variant="secondary">İkincil</Button>
      <Button variant="ghost">Hayalet</Button>
      <Button variant="danger">Tehlikeli</Button>
    </div>
  ),
}
```

### Story isimlendirme standardı

Her component için mümkün olan story adları aşağıdaki sırayla kullanılmalıdır:

1. `Default`
2. Görsel varyantlar: `Primary`, `Soft`, `Outline`, `Compact`, `Detailed`
3. Boyutlar: `Small`, `Medium`, `Large`
4. Veri state’leri: `Loading`, `Empty`, `Error`, `Success`
5. Etkileşim state’leri: `Selected`, `Disabled`, `ReadOnly`, `Submitting`
6. Domain state’leri: `Published`, `Rejected`, `PendingReview`
7. Responsive state’ler: `Mobile`, `Tablet`, `Desktop`
8. `VariantsComparison`

### Screen story matrisi

Her screen-level composition için en az şu story’ler bulunmalıdır:

```text
Loading
Empty
Error
Success
SuccessMobile
SuccessTablet
SuccessDesktop
Unauthorized
MutationPending
```

Ekrana göre ek story’ler:

- `ListingListPage`: `FilteredEmpty`, `BulkSelected`, `ArchivedListings`.
- `ApprovalQueue`: `QueueEmpty`, `ListingLocked`, `RevisionConflict`.
- `ListingReviewPanel`: `PublishedListing`, `RejectedListing`, `DecisionPending`, `PhotoViolation`, `MultipleReports`.
- `UserManagementPage`: `SuspendedUsers`, `BannedUsers`, `SuperAdminView`, `SupportView`.
- `CategoryAttributePage`: `DirtyEditor`, `ValidationErrors`, `PublishConflict`.
- `ReportManagementPage`: `CriticalReports`, `ResolvedReports`.
- `SettingsPage`: `ReadOnlyPermissions`, `EditablePermissions`, `UnsavedChanges`.

## 5.6. Kabul kriterleri

### Tip güvenliği

- `strict: true` açık olmalıdır.
- `noUncheckedIndexedAccess: true` açık olmalıdır.
- `exactOptionalPropertyTypes: true` açık olmalıdır.
- `noImplicitOverride: true` açık olmalıdır.
- `any` kullanılmamalıdır.
- Kategoriye özel ilan alanları discriminated union üzerinden daraltılmalıdır.
- Fixture’lar `Listing` tipini ihlal edememelidir.
- Generic `DataTable` satır tipini korumalıdır.
- Component callback payload’ları açık tipli olmalıdır.

### Domain doğruluğu

- Tüm `ListingStatus` değerleri UI’da ayrı görsel durumla temsil edilmelidir.
- UI yalnız izin verilen transition eylemlerini göstermelidir.
- Red ve düzeltme kararında en az bir gerekçe ve not zorunlu olmalıdır.
- `destek` rolü onay, red, pasif veya arşiv eylemi görememelidir.
- `icerikDenetcisi`, kullanıcı banlama veya rol değiştirme eylemi görememelidir.
- `moderator`, rol ve izin matrisini düzenleyememelidir.
- `superAdmin` tüm yönetim eylemlerini görebilmelidir.

### Tema ve stil

- Storybook toolbar’dan üç tema seçilebilmelidir.
- Tema değişiminde tüm açık story anında güncellenmelidir.
- Component CSS dosyalarında hex, RGB, HSL veya named color bulunmamalıdır.
- Sabit shadow, radius, spacing ve font size kullanılmamalıdır.
- Tüm görünür metinler en az `1rem` olmalıdır.
- Focus ring her temada görünür olmalıdır.
- Normal metin ve kritik kontrol kontrastı WCAG AA seviyesinde olmalıdır.
- Status yalnız renkle ifade edilmemelidir.

### Varyantlar

- Kritik componentlerin en az üç belirgin görsel veya yapısal varyantı olmalıdır.
- Tüm varyantlar ayrı story olarak görünmelidir.
- Kritik componentlerde `VariantsComparison` bulunmalıdır.
- Controls üzerinden varyant değiştirilebilmelidir.
- `DataTable`, comfortable ve compact yoğunluğu desteklemelidir.
- `ListingCard`, compact, detailed ve grid varyantlarını desteklemelidir.
- `StatusBadge`, solid, soft ve outline varyantlarını desteklemelidir.
- `ModerationActionBar`, sticky bottom, inline ve side rail varyantlarını desteklemelidir.
- `ImageGallery`, mosaic, filmstrip ve split varyantlarını desteklemelidir.

### Async state’ler

- Veri kullanan her composite ve screen için loading, empty, error ve success story’leri bulunmalıdır.
- Loading durumları layout shift üretmemelidir.
- Hata durumlarında retry eylemi bulunmalıdır.
- Mutation sırasında yalnız ilgili eylem kilitlenmelidir.
- Başarılı mutation toast üretmelidir.
- Revision conflict ayrı bir UI durumu olmalıdır.

### Erişilebilirlik

- Tüm form alanları erişilebilir label’a sahip olmalıdır.
- Yalnız ikonlu butonlarda zorunlu erişilebilir isim bulunmalıdır.
- Modal ve drawer odak yönetimi yapmalıdır.
- Escape tuşu uygun overlay’leri kapatmalıdır.
- Tab sırası mantıklı olmalıdır.
- Klavye ile tablo satırı, filtreler ve moderasyon eylemleri kullanılabilmelidir.
- Dokunma hedefleri en az 44×44 piksel olmalıdır.
- `prefers-reduced-motion` desteklenmelidir.
- Storybook axe kontrollerinde kritik ihlal bulunmamalıdır.

### Responsive davranış

- 320 piksel genişlik temel alınmalıdır.
- Desktop düzeni mobil CSS’in üzerine `min-width` sorgularıyla eklenmelidir.
- Sidebar mobilde drawer’a dönüşmelidir.
- `DataTable`, component prop’una göre mobil kart veya yatay kaydırma sunmalıdır.
- Sticky moderasyon çubuğu mobil safe-area boşluğunu dikkate almalıdır.
- Filtreler mobilde drawer veya dikey stack olmalıdır.
- Yatay taşan kontrol grupları erişilebilir kaydırma sağlamalıdır.
- Sayfa başlığı ve eylemler mobilde dikey sıralanmalıdır.

### Storybook

- Tüm story’ler CSF3 formatında olmalıdır.
- Tüm componentlerde `tags: ["autodocs"]` bulunmalıdır.
- Story callback’leri `fn()` kullanmalıdır.
- Fixture verileri deterministik olmalıdır.
- Story’ler internet erişimi olmadan render edilmelidir.
- Tüm component ve screen story’leri TypeScript hata vermeden build edilmelidir.
- `storybook build` başarılı tamamlanmalıdır.

### Kod kalitesi

- Component klasörleri kendi `index.ts` dosyasından export edilmelidir.
- Screen componentleri primitive detaylarını tekrar uygulamamalıdır.
- Formatlama yardımcıları component içinde kopyalanmamalıdır.
- İş kuralları `src/domain` altında tutulmalıdır.
- Props callback isimleri `on...` kalıbını kullanmalıdır.
- Boolean props olumlu isimlendirilmelidir.
- Gereksiz global state kullanılmamalıdır.
- Storybook için özel iş mantığı production componentlerine sızmamalıdır.

## 5.7. Claude Code için son uygulama talimatı

**Faz 1'den başla, faz faz uygula, gereksiz soru sorma; belirsizlikte en makul varsayımı yap ve devam et.**
