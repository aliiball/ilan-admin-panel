import { Bell, Menu } from 'lucide-react'
import { ADMIN_ROLE_LABEL } from '../../../domain/labels'
import { Avatar } from '../../primitives/Avatar'
import { Badge } from '../../primitives/Badge'
import { IconButton } from '../../primitives/IconButton'
import { SearchInput } from '../../primitives/SearchInput'
import type { TopBarProps } from '../../../types/component-props'
import * as css from './TopBar.css'

/** Rozette gösterilen en büyük sayı; üstü `99+` diye kırpılır. */
const ROZET_UST_SINIR = 99

/**
 * Panelin üst çubuğu: bulunulan bölüm, global arama, okunmamış bildirim sayısı
 * ve oturumu açık admin.
 *
 * **Varyant prop'u yok — ve olmaması doğru.** Brifing 3.4 üç varyant listeliyor
 * (full/compact/mobile) ama sözleşmede `variant` yok; çünkü üçü de veriden ve
 * ekrandan doğar, çağıranın seçiminden değil. `onSearchChange` verilmezse arama
 * kutusu hiç render edilmez ve çubuk kendiliğinden **compact** olur — kendi arama
 * alanı olan bir ekran global aramayı tekrar etmemeli. **Mobile** ise viewport'un
 * işi: `variant="mobile"` alsaydı 320 pikselde masaüstü çubuğu göstermek mümkün
 * olurdu. Hangi ekranda olduğumuzu tarayıcı bilir, sayfa değil.
 *
 * **Bildirim sayacı düğme değil, göstergedir.** Sözleşmede `onNotificationsClick`
 * yok; basıldığında hiçbir şey yapmayan bir zil, kapalı bir zilden kötüdür
 * (ModerationActionBar'ın opsiyonel handler'larıyla aynı kural: handler yoksa
 * eylem listelenmez). Bu yüzden sayaç `role="status"` taşıyan bir gösterge —
 * sayı değişince duyurulur, tıklanmaz. Bildirim listesine gitmek gerektiğinde
 * çözüm burada bir `onClick` uydurmak değil, sözleşmeye handler eklemektir.
 *
 * **`0` bildirimde rozet çıkmaz.** "0 okunmamış bildirim" bir haber değil,
 * haberin yokluğudur; rozet gösterilirse dikkat çekmek için var olan kırmızı bir
 * işaret kullanıcıyı boş bir listeye yollar ve bir süre sonra hiç bakılmaz olur.
 * `99`'un üstü **görselde** `99+` diye kırpılır ama ekran okuyucuya gerçek sayı
 * verilir: kırpma bir yer sorunudur, bilgi kaybı değil.
 *
 * **Ad ve rol mobilde `display: none` ile gizlenmiyor.** Profil düğmesinin
 * erişilebilir adı tam olarak o metinden hesaplanıyor ve `display: none` alt
 * ağacı ad hesabından da siler — Button'ın `loading` hâlinde yaşanan tuzağın
 * aynısı (AGENTS.md). 320 pikselde metin yerini bırakır ama erişilebilirlik
 * ağacında kalır; düğme adsız kalmaz.
 *
 * **Avatar `aria-hidden` bir sarmalayıcının içinde.** Baş harf yedeği (`EK`)
 * düz metindir — `alt` değil — ve düğmenin içinde açıkta bırakılsaydı erişilebilir
 * ad "EK Elif Kaya…" diye başlardı. Avatar zaten dekoratif: yanında adın kendisi
 * yazıyor.
 *
 * Çubuk **veri çekmez ve geciktirmez**: her tuş vuruşu anında `onSearchChange`
 * ile bildirilir. Debounce sayfa katmanının işi — neyin pahalı olduğunu o bilir.
 * Yetki de buranın işi değil: rolüne bakıp menü öğesi gizlemek yerine, sayfa
 * yalnız görülebilecek olanı verir.
 *
 * @example
 * <TopBar
 *   title="İlan Moderasyonu"
 *   currentUser={oturumAdmini}
 *   searchValue={sorgu}
 *   notificationsCount={okunmamisSayisi}
 *   onSearchChange={setSorgu}
 *   onMenuClick={() => setMobilMenuAcik(true)}
 *   onProfileClick={() => setProfilMenusuAcik(true)}
 * />
 */
export function TopBar({
  title,
  searchValue,
  currentUser,
  notificationsCount,
  onSearchChange,
  onMenuClick,
  onProfileClick,
}: TopBarProps) {
  /*
    `adminRole` sözleşmede opsiyonel: rol satırı ancak gerçekten varsa çıkar.
    Yoksa uydurulmaz — "Yönetici" gibi bir yer tutucu, rolü olmayan bir hesaba
    olmadığı bir yetki atfeder.
  */
  const rolEtiketi =
    currentUser.adminRole !== undefined ? ADMIN_ROLE_LABEL[currentUser.adminRole] : undefined

  const okunmamis = notificationsCount ?? 0

  const kimlikIcerigi = (
    <>
      {/* Baş harf yedeği düz metin: açıkta kalsa erişilebilir ada sızardı. */}
      <span className={css.avatarSlot} aria-hidden="true">
        <Avatar
          name={currentUser.fullName}
          size="sm"
          {...(currentUser.avatarUrl !== undefined && { src: currentUser.avatarUrl })}
        />
      </span>

      <span className={css.identityText}>
        <span className={css.identityName}>{currentUser.fullName}</span>
        {rolEtiketi !== undefined ? <span className={css.identityRole}>{rolEtiketi}</span> : null}
      </span>
    </>
  )

  return (
    <header className={css.root}>
      <div className={css.context}>
        {onMenuClick !== undefined ? (
          <span className={css.menuSlot}>
            <IconButton icon={<Menu size={20} />} label="Menüyü aç" onClick={onMenuClick} />
          </span>
        ) : null}

        {title !== undefined && title !== '' ? <span className={css.title}>{title}</span> : null}
      </div>

      {onSearchChange !== undefined ? (
        <div className={css.search}>
          {/*
            Etiket görünmüyor: çubukta etiket satırına yer yok ve büyüteç ikonu
            kutunun ne olduğunu zaten söylüyor. `label` yerine `aria-label`
            veriliyor — placeholder etiket yerine geçmez, kullanıcı yazmaya
            başlayınca kaybolur.

            `onSearch` değil `onChange` bağlanıyor: `onSearch` geciktirmeli
            (debounce) kanal ve geciktirme TopBar'ın kararı değil.

            `onClear` de bağlanmak zorunda: SearchInput kontrollü kullanımda
            kutuyu kendisi boşaltmaz, yalnız haber verir — değerin sahibi
            çağırandır. Bağlanmasaydı temizleme düğmesi görünür ama hiçbir şey
            yapmazdı.
          */}
          <SearchInput
            aria-label="Panelde ara"
            placeholder="İlan, kullanıcı veya şikayet ara"
            size="sm"
            {...(searchValue !== undefined && { value: searchValue })}
            onChange={(event) => onSearchChange(event.target.value)}
            onClear={() => onSearchChange('')}
          />
        </div>
      ) : null}

      <div className={css.actions}>
        {okunmamis > 0 ? (
          <span className={css.notifications} role="status">
            <Bell size={20} aria-hidden="true" />

            {/*
              Rozetin görünen metni `aria-hidden`: tek başına okunan "99+" ne
              olduğunu söylemez, üstelik kırpılmış bir sayıdır. Ekran okuyucuya
              aşağıdaki gizli metinle gerçek sayı gidiyor.
            */}
            <Badge tone="danger" variant="solid" size="sm" aria-hidden="true">
              {okunmamis > ROZET_UST_SINIR
                ? `${ROZET_UST_SINIR}+`
                : okunmamis.toLocaleString('tr-TR')}
            </Badge>

            <span className={css.visuallyHidden}>
              {okunmamis.toLocaleString('tr-TR')} okunmamış bildirim
            </span>
          </span>
        ) : null}

        {onProfileClick !== undefined ? (
          <button type="button" className={css.identityButton} onClick={onProfileClick}>
            {kimlikIcerigi}
            {/*
              `aria-label` yerine gizli ek metin: `aria-label` içeriğin tamamını
              ezer, o zaman görünen ad ile erişilebilir ad iki ayrı kaynaktan
              beslenir ve biri güncellenirken diğeri unutulur. Böyle yazınca
              erişilebilir ad görünen metni **içerir** (WCAG 2.5.3).
            */}
            <span className={css.visuallyHidden}> — profil menüsü</span>
          </button>
        ) : (
          <span className={css.identity}>{kimlikIcerigi}</span>
        )}
      </div>
    </header>
  )
}
