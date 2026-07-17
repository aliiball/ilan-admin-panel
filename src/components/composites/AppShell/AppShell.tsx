import { useId } from 'react'
import type { AppShellProps } from '../../../types/component-props'
import * as css from './AppShell.css'

/**
 * Panelin iskeleti: menü, üst çubuk ve ana içerik.
 *
 * **Salt düzendir.** `navigation` ve `topBar` birer `ReactNode`; kabuk menünün
 * daraltılmışlığını, satırlarını ya da aktif rotayı bilmez. Bilmediği için de
 * onlara karışmaz: sözleşmesinde `collapsed`, `mobileOpen` veya `onMenuClick`
 * yok — üçü de `SidebarNavProps`/`TopBarProps`'ta.
 *
 * **Çekmeceyi AppShell açmaz.** Brifingin "sidebar mobilde drawer'a dönüşmelidir"
 * kriterini karşılayan zincir sayfa katmanında kurulur: `TopBar.onMenuClick` →
 * `SidebarNav.mobileOpen`. Kabuğun payına düşen tek şey **yoldan çekilmek**: dar
 * ekranda menüye kolon ayırmaz. Slot'u `display: none` ile gizlemiyoruz da —
 * çekmecesini portal yerine kendi içinde `position: fixed` ile çizen bir menü
 * o an yok olurdu. Kutu `display: contents` ile düzenden çıkar, çocuğu kalır;
 * çekmeceyi kimin nasıl açtığı hakkında hiçbir varsayım yapmıyoruz.
 *
 * **Menünün genişliğini de kabuk vermez** (kolon `auto`). Daraltılmış menü dar,
 * genişletilmiş menü geniş bir kolon alır. Kabuk bir genişlik dayatsaydı
 * `collapsible` modun çalışması için AppShell'e ikinci bir `collapsed` state'i
 * gerekirdi — ve iki yerde tutulan aynı state kaçınılmaz olarak ayrışırdı.
 *
 * **`sidebarMode` düzende tek bir şeyi değiştirir: üst çubuğun nereden
 * başladığı.** `fixed`'te menü tam yüksekliktedir, çubuk onun sağındadır.
 * `collapsible`'da çubuk tam genişlikte üsttedir, menü altındadır — çünkü menü
 * daralıp genişledikçe kolon genişliği değişir ve yanına konmuş bir çubuğun
 * arama kutusu ile profil menüsü her daraltmada yana kayardı. Tam genişlik
 * çubukta yalnız içeriğin sol kenarı oynar. Dar ekranda ikisi de aynıdır.
 *
 * **DOM sırası moddan bağımsız sabittir:** banner → navigation → main. Sıra
 * `gridTemplateAreas` ile değil DOM'la belirlenseydi, mod değişince ekran
 * okuyucunun okuma sırası da değişirdi — aynı panelin iki farklı okunuşu.
 *
 * **Kendi `<nav>`'ını açmaz.** Menü landmark'ı slot'un içeriğinin (SidebarNav)
 * işi; burada bir `<nav>` daha açmak iç içe iki navigation landmark'ı üretir ve
 * ekran okuyucu menüyü iki kez listeler. Kabuk yalnız `<header>` ve `<main>`
 * landmark'larını açar; `RendersNoNavigationLandmark` story'si bunu ölçüyor.
 *
 * **"İçeriğe atla" bağlantısı ilk odaklanılabilir öğedir.** Klavye kullanıcısı
 * her sayfa geçişinde 20 menü satırını baştan geçmemeli. Hedef `<main>`
 * `tabIndex={-1}` taşır: onsuz Safari yalnız kaydırır, odak menüde kalır ve
 * sonraki Tab kullanıcıyı menünün ortasına geri atar. Hedefin `id`'si `useId`
 * ile üretilir — sabit bir `id` yazsaydık aynı sayfadaki iki kabuk (bkz.
 * `VariantsComparison`) aynı id'yi paylaşır, ikinci kabuğun bağlantısı birinci
 * kabuğun içeriğine atlardı.
 *
 * @example
 * <AppShell
 *   sidebarMode="collapsible"
 *   navigation={
 *     <SidebarNav
 *       items={yetkiyeGoreSuzulmusMenu}
 *       activeItemId="moderation"
 *       collapsed={dar}
 *       onCollapsedChange={setDar}
 *       mobileOpen={cekmeceAcik}
 *       onMobileOpenChange={setCekmeceAcik}
 *     />
 *   }
 *   topBar={<TopBar currentUser={oturumAdmini} onMenuClick={() => setCekmeceAcik(true)} />}
 * >
 *   <Outlet />
 * </AppShell>
 */
export function AppShell({ navigation, topBar, children, sidebarMode = 'fixed' }: AppShellProps) {
  const anaIcerikId = `ana-icerik${useId()}`

  return (
    <div className={css.root({ sidebarMode })}>
      <a className={css.skipLink} href={`#${anaIcerikId}`}>
        İçeriğe atla
      </a>

      <header className={css.topBarSlot}>{topBar}</header>

      <div className={css.sidebarSlot}>{navigation}</div>

      <main id={anaIcerikId} className={css.mainSlot} tabIndex={-1}>
        {children}
      </main>
    </div>
  )
}
