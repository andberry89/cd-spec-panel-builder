import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { mount } from '@vue/test-utils'
import App from '../App.vue'
import { panelDraftStorageKey } from '../panelDraft'

const createStorage = (): Storage => {
  const values = new Map<string, string>()
  return {
    get length() { return values.size },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
  }
}

describe('App', () => {
  let storage: Storage

  beforeEach(() => {
    storage = createStorage()
    Object.defineProperty(window, 'localStorage', { configurable: true, value: storage })
  })

  afterEach(() => {
    storage.clear()
    vi.restoreAllMocks()
  })

  it('mounts renders properly', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('C/D Spec Panel Builder')
    expect(wrapper.text()).toContain('Vehicle 1')
    expect(wrapper.text()).toContain('Preview')
  })

  it('shows missing vehicle identity details without blocking editing', async () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('Vehicle 1 is missing year, make, and model')

    await wrapper.find('input[placeholder="2026"]').setValue('2025')
    expect(wrapper.text()).toContain('Vehicle 1 is missing make and model')
    expect(wrapper.find('button.copy-button').attributes('disabled')).toBeUndefined()

    wrapper.unmount()
  })

  it('automatically saves the panel and restores it on the next visit', async () => {
    const wrapper = mount(App)
    await wrapper.find('input[placeholder="2026"]').setValue('2024')

    await vi.waitFor(() => {
      const saved = window.localStorage.getItem(panelDraftStorageKey)
      expect(saved).not.toBeNull()
      const draft = JSON.parse(saved ?? '{}') as {
        panel: { vehicleOne: { identity: { year: string } } }
      }
      expect(draft.panel.vehicleOne.identity.year).toBe('2024')
    }, { timeout: 1500 })
    wrapper.unmount()

    const restored = mount(App)
    expect((restored.find('input[placeholder="2026"]').element as HTMLInputElement).value).toBe('2024')
    expect(restored.text()).toContain('Draft restored from this browser.')
    restored.unmount()
  })

  it('starts with a blank panel when saved draft data is unreadable', () => {
    window.localStorage.setItem(panelDraftStorageKey, '{not-json')

    const wrapper = mount(App)
    expect((wrapper.find('input[placeholder="2026"]').element as HTMLInputElement).value).toBe('')
    expect(wrapper.text()).toContain('Changes save automatically in this browser.')
    wrapper.unmount()
  })

  it('preserves manual HTML when form values change and asks before replacing it', async () => {
    const wrapper = mount(App)
    const textarea = wrapper.find('textarea[aria-label="Editable specifications HTML"]')
    await wrapper.find('input[placeholder="2026"]').setValue('2026')
    expect((textarea.element as HTMLTextAreaElement).value).toContain('2026')

    const manualHtml = '<p><strong>Editor adjustment</strong></p>'
    await textarea.setValue(manualHtml)

    expect(wrapper.find('iframe').attributes('sandbox')).toBe('')
    expect(wrapper.find('iframe').attributes('srcdoc')).toContain(manualHtml)
    expect(wrapper.text()).toContain('Manual edits are preserved.')

    await wrapper.find('input[placeholder="2026"]').setValue('2025')
    expect((textarea.element as HTMLTextAreaElement).value).toBe(manualHtml)

    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    await wrapper.find('button.regenerate-button').trigger('click')
    expect((textarea.element as HTMLTextAreaElement).value).toBe(manualHtml)

    confirm.mockReturnValue(true)
    await wrapper.find('button.regenerate-button').trigger('click')
    expect(confirm).toHaveBeenCalledTimes(2)
    expect((textarea.element as HTMLTextAreaElement).value).toContain('2025')
    expect(wrapper.text()).not.toContain('Manual edits are preserved.')
    wrapper.unmount()
  })

  it('copies the edited HTML and restores manual source edits from the saved draft', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    const wrapper = mount(App)
    const manualHtml = '<p>Ready to paste</p>'
    await wrapper.find('textarea[aria-label="Editable specifications HTML"]').setValue(manualHtml)
    await wrapper.find('button.copy-button').trigger('click')
    expect(writeText).toHaveBeenCalledWith(manualHtml)

    await vi.waitFor(() => {
      const saved = window.localStorage.getItem(panelDraftStorageKey)
      expect(saved).not.toBeNull()
      const draft = JSON.parse(saved ?? '{}') as { htmlOverride?: string }
      expect(draft.htmlOverride).toBe(manualHtml)
    }, { timeout: 1500 })
    wrapper.unmount()

    const restored = mount(App)
    expect((restored.find('textarea[aria-label="Editable specifications HTML"]')
      .element as HTMLTextAreaElement).value).toBe(manualHtml)
    expect(restored.text()).toContain('Manual edits are preserved.')
    restored.unmount()
  })
})
