import { tagDedupeKey } from 'zhead'
import type { HeadTag, HeadTagKeys } from '@unhead/schema'
import { defineHeadPlugin } from '..'

export interface DedupesTagsPluginOptions {
  dedupeKeys?: string[]
}

export const DedupesTagsPlugin = (options?: DedupesTagsPluginOptions) => {
  options = options || {}
  const dedupeKeys = options.dedupeKeys || ['hid', 'vmid', 'key'] as HeadTagKeys
  return defineHeadPlugin({
    hooks: {
      'tag:normalise': function ({ tag }) {
        // support for third-party dedupe keys
        dedupeKeys.forEach((key) => {
          if (tag.props[key]) {
            tag.key = tag.props[key]
            delete tag.props[key]
          }
        })
        const dedupe = tag.key ? `${tag.tag}:${tag.key}` : tagDedupeKey(tag)
        if (dedupe)
          tag._d = dedupe
      },
      'tags:resolve': function (ctx) {
        // 1. Dedupe tags
        const deduping: Record<string, HeadTag> = {}
        ctx.tags.forEach((tag, i) => {
          let dedupeKey = tag._d || tag._p || i
          const dupedTag = deduping[dedupeKey]
          // handling a duplicate tag
          if (dupedTag) {
            // default strategy is replace, unless we're dealing with a html or body attrs
            let strategy = tag?.tagDuplicateStrategy
            if (!strategy && (tag.tag === 'htmlAttrs' || tag.tag === 'bodyAttrs'))
              strategy = 'merge'

            if (strategy === 'merge') {
              const oldProps = dupedTag.props
              // apply oldProps to current props
              ;['class', 'style'].forEach((key) => {
                if (tag.props[key] && oldProps[key])
                  tag.props[key] = `${oldProps[key]} ${tag.props[key]}`
              })
              deduping[dedupeKey].props = {
                ...oldProps,
                ...tag.props,
              }
              return
            }
            else if (tag._e === dupedTag._e) {
              // allow entries to have duplicate tags
              dedupeKey = `${dedupeKey}:entry(${tag._e}:${tag._p})`
              // need to copy over the unique _s key and change it
              if (dupedTag._s) {
                delete tag.props[dupedTag._s]
                tag._s = dupedTag._s + tag._p
                tag.props[tag._s] = ''
              }
              tag._d = dedupeKey
            }
            // if the new tag does not have any props we're trying to remove the dupedTag
            if (Object.keys(tag.props).length === 0 && !tag.children) {
              delete deduping[dedupeKey]
              return
            }
          }
          deduping[dedupeKey] = tag
        })
        ctx.tags = Object.values(deduping)
      },
    },
  })
}
