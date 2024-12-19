import type { FormField } from '@xfc/vue3-form-render'
import type { FormItemRule } from 'element-plus'

export const useFormItem = function (field: FormField) {
  delete field.props.class
  delete field.props.style
  delete field.on
  delete field.slots
  delete field.children
  const { id, label, required } = field
  const rules = buildRule(field)
  field.props = {
    prop: id,
    label: label,
    required: required,
    rules: rules
  }
}

const buildRule = (field: FormField) => {
  const { props, rules } = field
  let ruleList: FormItemRule[] = []
  if (Array.isArray(rules)) {
    ruleList.push(
      ...rules.map((rule) => {
        return {
          pattern: rule.pattern && new RegExp(rule.pattern),
          message: `请输入正确的${rule.message}`
        }
      })
    )
  }
  if (field.required !== undefined) {
    const required: FormItemRule = {
      required: field.required || false,
      message: props.placeholder
    }
    if (Array.isArray(field.value)) {
      required.type = 'array'
      required.message = `请至少选择一个${field.label}`
      required.trigger = 'change'
    }
    required.message === undefined && (required.message = `${field.label}不能为空`)
    ruleList.push(required)
  }
  return ruleList
}
