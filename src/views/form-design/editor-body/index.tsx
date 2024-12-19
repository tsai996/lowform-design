import type { PropType, Ref, VNode } from 'vue'
import Draggable from 'vuedraggable'
import { CopyDocument, Delete, Rank } from '@element-plus/icons-vue'
import './index.scss'
import { cloneDeep } from 'lodash-es'
import { type FormField, JsonRender } from '@xfc/vue3-form-render'

export default defineComponent({
  props: {
    formConf: {
      type: Object as PropType<FormField>,
      required: true
    }
  },
  components: { Draggable },
  setup(props) {
    const { activeData } = inject<{
      activeData: Ref<FormField>
    }>('formDesign')!
    const renders: Recordable<
      (field: FormField, index: number, list: FormField[], parent: FormField) => VNode
    > = {
      Form: (field: FormField, index: number, list: FormField[], parent: FormField): VNode => {
        const active = activeData.value?.id === field.id
        const className = ['editor-form', { 'is-active': active }]
        return (
          <el-form
            label-position={field.props.labelPosition}
            disabled={field.readonly}
            label-width={`${field.props.labelWidth}px`}
            size={field.props.size}
            class={className}
            onClick={(event: MouseEvent) => {
              activeData.value = field
              event.stopPropagation()
            }}
          >
            <Draggable
              list={field.children}
              class="drawing-board p5px"
              // @ts-ignore
              animation={340}
              handle=".pointer-move"
              group={{ name: 'componentsGroup', clone: false }}
              item-key="id"
              onAdd={({ newIndex }: { newIndex: number }) => {
                activeData.value = field.children![newIndex]
              }}
            >
              {{
                item: ({ element, index }: { element: FormField; index: number }) => {
                  return renderItem(element, index, field.children ?? [], field)
                }
              }}
            </Draggable>
          </el-form>
        )
      },
      formItem: (field: FormField, index: number, list: FormField[], parent: FormField): VNode => {
        const active = activeData.value?.id === field.id
        const className = ['drawing-item', { active: active }, { is_hidden: field.hidden }]
        const child = renderChildren(field)
        return (
          <div
            class={className}
            onClick={(event: MouseEvent) => {
              activeData.value = field
              event.stopPropagation()
            }}
          >
            <el-form-item label={field.label} required={field.required} class="field-wrapper">
              <JsonRender
                key={field.props.key}
                field={field}
                modelValue={field.value}
                onUpdate:modelValue={(val) => {
                  if (field.readonly) return
                  field.value = val
                }}
              >
                {child}
              </JsonRender>
            </el-form-item>
            {active ? itemButtons(field, index, list, parent) : null}
          </div>
        )
      },
      container: (field: FormField, index: number, list: FormField[], parent: FormField): VNode => {
        const active = activeData.value?.id === field.id
        const className = ['drawing-item', { active: active }, { is_hidden: field.hidden }]
        const containers: string[] = ['Tab', 'Collapse', 'Row']
        const child = containers.includes(field.name) ? renderInner(field) : renderChildren(field)
        return (
          <div
            class={className}
            onClick={(event: MouseEvent) => {
              activeData.value = field
              event.stopPropagation()
            }}
          >
            <div class="field-wrapper">
              <JsonRender
                key={field.props.key}
                field={field}
                modelValue={field.value}
                onUpdate:modelValue={(val) => {
                  field.value = val
                }}
              >
                {child}
              </JsonRender>
            </div>
            {active ? itemButtons(field, index, list, parent) : null}
          </div>
        )
      }
    }
    const itemButtons = (
      field: FormField,
      index: number,
      list: FormField[],
      parent: FormField
    ): VNode[] => {
      return [
        <div class="pointer-move">
          <el-icon size={15}>
            <Rank />
          </el-icon>
        </div>,
        <div class="pointer-wrapper">
          <div
            onClick={(event: MouseEvent) => {
              const clone = cloneDeep(field)
              const generateId = (clone: FormField) => {
                clone.id = `field_${Math.random().toString(36).substring(2, 7)}`
                clone.children?.forEach((el) => {
                  generateId(el)
                })
              }
              generateId(clone)
              list.splice(index + 1, 0, clone)
              activeData.value = clone
              event.stopPropagation()
            }}
          >
            <el-icon size={14}>
              <CopyDocument />
            </el-icon>
          </div>
          <div
            onClick={(event: MouseEvent) => {
              list.splice(index, 1)
              const len = list.length
              if (len > 0) {
                if (index < len) {
                  activeData.value = list[index]
                } else {
                  activeData.value = list[index - 1]
                }
              } else {
                activeData.value = parent
              }
              event.stopPropagation()
            }}
          >
            <el-icon size={14}>
              <Delete />
            </el-icon>
          </div>
        </div>
      ]
    }
    const renderItem = (
      field: FormField,
      index: number,
      list: FormField[],
      parent: FormField
    ): VNode => {
      const layout = renders[field.name] || renders[field.type]
      if (layout) {
        return layout(field, index, list, parent)
      }
      throw new Error(`未找到${field.type}类型的布局`)
    }
    const renderChildren = (field: FormField): VNode | undefined => {
      if (field.children) {
        return (
          <Draggable
            list={field.children}
            class="widget-list drawing-board"
            // @ts-ignore
            animation={340}
            handle=".pointer-move"
            group={{ name: 'componentsGroup', clone: false }}
            item-key="id"
          >
            {{
              item: ({ element, index }: { element: FormField; index: number }) => {
                return renderItem(element, index, field.children ?? [], field)
              }
            }}
          </Draggable>
        )
      }
    }
    const renderInner = (field: FormField) => {
      return field.children?.map((el: FormField) => {
        return (
          <JsonRender
            key={el.props.key}
            field={el}
            modelValue={el.value}
            onUpdate:modelValue={(val) => (el.value = val)}
          >
            {{
              default: () => renderChildren(el)
            }}
          </JsonRender>
        )
      })
    }
    return () => {
      const render = renderItem(props.formConf, 0, [], props.formConf)
      return <div class="drawing-board">{render}</div>
    }
  }
})
