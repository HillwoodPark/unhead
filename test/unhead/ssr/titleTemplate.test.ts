import { createHead } from 'unhead'
import { renderSSRHead } from '@unhead/ssr'

describe('titleTemplate', () => {
  test('string replace', async () => {
    const head = createHead()
    head.push({
      titleTemplate: '%s - my template',
      title: 'test',
    })
    const { headTags } = await renderSSRHead(head)
    expect(headTags).toMatchInlineSnapshot(
      '"<title>test - my template</title>"',
    )
  })
  test('fn replace', async () => {
    const head = createHead()
    head.push({
      titleTemplate: (title?: string) => `${title} - my template`,
      title: 'test',
    })
    const { headTags } = await renderSSRHead(head)
    expect(headTags).toMatchInlineSnapshot(
      '"<title>test - my template</title>"',
    )
  })
  test('titleTemplate as title', async () => {
    const head = createHead()
    head.push({
      titleTemplate: (title?: string) => title ? `${title} - Template` : 'Default Title',
      title: null,
    })
    const { headTags } = await renderSSRHead(head)
    expect(headTags).toMatchInlineSnapshot(
      '"<title>Default Title</title>"',
    )
  })
  test('reset title template', async () => {
    const head = createHead()
    head.push({
      titleTemplate: (title?: string) => title ? `${title} - Template` : 'Default Title',
    })
    head.push({
      titleTemplate: null,
      title: 'page title',
    })
    const { headTags } = await renderSSRHead(head)
    expect(headTags).toMatchInlineSnapshot(
      '"<title>page title</title>"',
    )
  })

  test('nested title template', async () => {
    const head = createHead()
    head.push({
      titleTemplate: (title?: string) => title ? `${title} - Template` : 'Default Title',
    })
    head.push({
      titleTemplate: null,
    })
    const { headTags } = await renderSSRHead(head)
    expect(headTags).toMatchInlineSnapshot(
      '""',
    )
  })

  test('null fn return', async () => {
    const head = createHead()
    head.push({
      titleTemplate: (title?: string) => title === 'test' ? null : `${title} - Template`,
      title: 'test',
    })
    const { headTags } = await renderSSRHead(head)
    expect(headTags).toMatchInlineSnapshot('""')
  })

  test('empty title', async () => {
    const head = createHead()
    head.push({
      title: '',
    })
    const { headTags } = await renderSSRHead(head)
    expect(headTags).toMatchInlineSnapshot(
      '"<title></title>"',
    )
  })
})