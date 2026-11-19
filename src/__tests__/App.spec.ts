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
})
