import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import App from '../App.vue'

describe('App', () => {
  it('mounts renders properly', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('C/D Spec Panel Builder')
    expect(wrapper.text()).toContain('Vehicle 1')
    expect(wrapper.text()).toContain('Preview')
  })
})
