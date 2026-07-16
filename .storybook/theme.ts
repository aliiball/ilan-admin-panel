import { create } from 'storybook/theming'

/**
 * Manager (sidebar/toolbar) teması.
 *
 * Başlık yalnızca yönetim arayüzünde görünür; story'nin render edildiği preview
 * canvas'ına eklenmediği için görsel regresyon snapshot'larını kirletmez.
 */
export const adminPanelTheme = create({
  base: 'light',
  brandTitle: 'İlan Admin Panel UI · #admin-panel',
  brandTarget: '_self',
})
