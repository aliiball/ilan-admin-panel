import { ChevronRight } from 'lucide-react'
import type { PageHeaderProps } from '../../../types/component-props'
import * as css from './PageHeader.css'

/**
 * Ekranın başlığı: yol, ad, bağlam ve sayfanın eylemleri.
 *
 * **Başlık `<h1>`'dir ve ekranın tek h1'i odur.** Ekran okuyucu kullanıcısı
 * sayfaya girdiğinde "neredeyim" sorusunu belge taslağından cevaplar; panel ve
 * kart başlıkları `<h2>`/`<h3>` olarak bunun altına dizilir. `TopBar.title` bu
 * işi yapamaz — o her sayfada aynı yerde duran bağlam çubuğu, sayfanın adı değil.
 *
 * **Son kırıntı `href` alsa bile bağlantı olmaz.** Sözleşme "son öğeye `href`
 * vermeyin" diyor ama kırıntı dizisi pratikte route yapılandırmasından mekanik
 * olarak türetilir ve her kaydın kendi yolu vardır; ona güvenen bir başlık her
 * ekranda kullanıcıyı bulunduğu yere götüren bir bağlantı üretirdi. Son öğe her
 * zaman `aria-current="page"` taşıyan düz metindir — sözleşmeye uyulmadığında da
 * çıktı doğru kalır.
 *
 * **Kırıntı yolu `<nav aria-label="Sayfa yolu">` + `<ol>`.** Sıra anlamın kendisi
 * (Panel → İlanlar → Bu ilan), `<ul>` bunu söylemez. Ayraç ikonu dekoratiftir ve
 * gizlenir: ekran okuyucu "büyüktür" diye okumamalı. Kırıntı yoksa — boş dizi de
 * dahil — `<nav>` hiç render edilmez; içi boş bir gezinme landmark'ı "Sayfa yolu,
 * liste, 0 öğe" diye duyulur.
 *
 * **Eylemler taşarsa sarar, "…" menüsüne toplanmaz.** `primaryAction` ve
 * `secondaryActions` opak `ReactNode`; başlık içlerinde kaç buton olduğunu
 * bilemez, dolayısıyla hangisini menüye alacağını da seçemez. Menü gerekiyorsa
 * onu sayfa katmanı kurar ve `secondaryActions` içinde hazır geçer. Yetki
 * kontrolü de buranın işi değil: yetkisi olmayan kullanıcıya `disabled` buton
 * değil, **hiç prop** geçilmez.
 *
 * `<header>` AppShell'in `<main>`'i içinde landmark üretmez (banner yalnız üst
 * seviyede oluşur); banner TopBar'ındır. Storybook'ta gövdeye doğrudan bağlı
 * render edildiği için orada banner sayılır — düzenle ilgisi yok.
 *
 * @example
 * <PageHeader
 *   title={ilan.title}
 *   breadcrumbs={[
 *     { label: 'Panel', href: '/panel' },
 *     { label: 'İlanlar', href: '/panel/ilanlar' },
 *     { label: ilan.title },
 *   ]}
 *   meta={<StatusBadge status={ilan.status} />}
 *   primaryAction={yetkiler.canApprove ? <Button onClick={onayla}>Onayla</Button> : undefined}
 * />
 */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  primaryAction,
  secondaryActions,
  meta,
}: PageHeaderProps) {
  const kirintilar = breadcrumbs ?? []
  const eylemVar = primaryAction !== undefined || secondaryActions !== undefined

  return (
    <header className={css.root}>
      {kirintilar.length > 0 ? (
        <nav aria-label="Sayfa yolu">
          <ol className={css.crumbList}>
            {kirintilar.map((kirinti, sira) => {
              const sonuncu = sira === kirintilar.length - 1

              return (
                /* Kırıntının kimliği yok; sıra + etiket bu liste için yeterince
                   ayırt edici ve route değişmeden yeniden sıralanmıyor. */
                <li key={`${sira}-${kirinti.label}`} className={css.crumb}>
                  {sonuncu || kirinti.href === undefined ? (
                    <span
                      className={sonuncu ? css.crumbCurrent : css.crumbText}
                      {...(sonuncu && { 'aria-current': 'page' as const })}
                    >
                      {kirinti.label}
                    </span>
                  ) : (
                    <a className={css.crumbLink} href={kirinti.href}>
                      {kirinti.label}
                    </a>
                  )}

                  {sonuncu ? null : (
                    <ChevronRight className={css.separator} size={16} aria-hidden="true" />
                  )}
                </li>
              )
            })}
          </ol>
        </nav>
      ) : null}

      <div className={css.main}>
        <div className={css.titleBlock}>
          <div className={css.titleRow}>
            {/*
              Meta h1'in dışında: içine alınsaydı rozetin metni ("İnceleme
              bekliyor") başlığın erişilebilir adına karışır ve başlık listesinde
              sayfanın adı okunmaz hâle gelirdi. Ölçen story:
              `TitleIsTheOnlyLevelOneHeading`.
            */}
            <h1 className={css.title}>{title}</h1>
            {meta !== undefined ? <div className={css.meta}>{meta}</div> : null}
          </div>

          {description !== undefined ? <p className={css.description}>{description}</p> : null}
        </div>

        {eylemVar ? (
          /* DOM sırası görsel sırayla aynı: ikincil eylemler solda, ana eylem
             sağda. Tab sırası da bunu izler — ana eylem en sonda. */
          <div className={css.actions}>
            {secondaryActions}
            {primaryAction}
          </div>
        ) : null}
      </div>
    </header>
  )
}
