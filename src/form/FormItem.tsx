import React, { forwardRef, ReactNode, useState, useImperativeHandle, useEffect, useRef } from 'react';
import classNames from 'classnames';
import isObject from 'lodash/isObject';
import lodashTemplate from 'lodash/template';
import { CheckCircleFilledIcon, CloseCircleFilledIcon, ErrorCircleFilledIcon } from 'tdesign-icons-react';
import useConfig from '../_util/useConfig';
import type { TdFormItemProps, ValueType, FormItemValidateMessage } from './type';
import Checkbox from '../checkbox';
import Upload from '../upload';
import Tag from '../tag';
import renderTNode from '../_util/renderTNode';
import { StyledProps } from '../common';
import { validate as validateModal, isValueEmpty } from './formModel';
import { useFormContext } from './FormContext';

enum VALIDATE_STATUS {
  TO_BE_VALIDATED = 'not',
  SUCCESS = 'success',
  FAIL = 'fail',
}
export interface FormItemProps extends TdFormItemProps, StyledProps {
  children?: React.ReactNode;
}

// FormItem 子组件受控 key
const ctrlKeyMap = new Map();
ctrlKeyMap.set(Checkbox, 'checked');
ctrlKeyMap.set(Tag.CheckTag, 'checked');
ctrlKeyMap.set(Upload, 'files');

// FormItem 默认数据类型
const initialDataMap = new Map();
initialDataMap.set(Upload, []);
initialDataMap.set(Checkbox.Group, []);

function getDefaultInitialData(children: React.ReactNode, initialData: any) {
  let defaultInitialData = initialData;
  React.Children.forEach(children, (child) => {
    if (!child) return;
    if (React.isValidElement(child) && typeof initialData === 'undefined') {
      defaultInitialData = initialDataMap.get(child.type);
    }
  });
  return defaultInitialData;
}

const FormItem = forwardRef<HTMLDivElement, FormItemProps>((props, ref) => {
  const { classPrefix } = useConfig();
  const {
    colon,
    layout,
    requiredMark: requiredMarkFromContext,
    labelAlign: labelAlignFromContext,
    labelWidth: labelWidthFromContext,
    showErrorMessage: showErrorMessageFromContext,
    disabled: disabledFromContext,
    resetType: resetTypeFromContext,
    rules: rulesFromContext,
    statusIcon: statusIconFromContext,
    errorMessage,
    formItemsRef,
    onFormItemValueChange,
  } = useFormContext();

  const {
    children,
    style,
    label,
    name,
    help,
    initialData,
    className,
    successBorder,
    statusIcon = statusIconFromContext,
    rules: innerRules = rulesFromContext?.[name] || [],
    labelWidth = labelWidthFromContext,
    labelAlign = labelAlignFromContext,
    requiredMark = requiredMarkFromContext,
    showErrorMessage = showErrorMessageFromContext,
  } = props;

  const [errorList, setErrorList] = useState([]);
  const [successList, setSuccessList] = useState([]);
  const [verifyStatus, setVerifyStatus] = useState(VALIDATE_STATUS.TO_BE_VALIDATED);
  const [resetValidating, setResetValidating] = useState(false);
  const [needResetField, setNeedResetField] = useState(false);
  const [formValue, setFormValue] = useState(getDefaultInitialData(children, initialData));

  const currentFormItemRef = useRef();
  const innerFormItemsRef = useRef([]);
  const shouldValidate = useRef(null);
  const isMounted = useRef(false);

  const formItemClass = classNames(className, `${classPrefix}-form__item`, {
    [`${classPrefix}-form-item__${name}`]: name,
    [`${classPrefix}-form__item-with-help`]: help,
    [`${classPrefix}-form__item-with-extra`]: renderTipsInfo(),
  });
  const formItemLabelClass = classNames(`${classPrefix}-form__label`, {
    [`${classPrefix}-form__label--required`]:
      requiredMark && innerRules.filter((rule: any) => rule.required).length > 0,
    [`${classPrefix}-form__label--colon`]: colon && label,
    [`${classPrefix}-form__label--top`]: labelAlign === 'top' || !labelWidth,
    [`${classPrefix}-form__label--left`]: labelAlign === 'left' && labelWidth,
    [`${classPrefix}-form__label--right`]: labelAlign === 'right' && labelWidth,
  });

  const contentClass = () => {
    const controlCls = `${classPrefix}-form__controls`;
    if (!showErrorMessage) return controlCls;

    const isSuccess = verifyStatus === VALIDATE_STATUS.SUCCESS;
    if (isSuccess) {
      return classNames(controlCls, `${classPrefix}-is-success`, {
        [`${classPrefix}-form--success-border`]: successBorder,
      });
    }

    const firstErrorType = errorList.length && (errorList[0].type || 'error');
    return classNames(controlCls, {
      [`${classPrefix}-is-warning`]: firstErrorType === 'warning',
      [`${classPrefix}-is-error`]: firstErrorType === 'error',
    });
  };

  let labelStyle = {};
  let contentStyle = {};
  if (label && labelWidth && labelAlign !== 'top') {
    if (typeof labelWidth === 'number') {
      labelStyle = { width: `${labelWidth}px` };
      contentStyle = { marginLeft: layout !== 'inline' ? `${labelWidth}px` : '' };
    } else {
      labelStyle = { width: labelWidth };
      contentStyle = { marginLeft: layout !== 'inline' ? labelWidth : '' };
    }
  }

  function renderTipsInfo() {
    let helpNode = null;
    if (help) helpNode = <div className={`${classPrefix}-form__help`}>{renderTNode(help)}</div>;

    const list = errorList;
    if (showErrorMessage && list && list[0] && list[0].message) {
      return <p className={`${classPrefix}-input__extra`}>{list[0].message}</p>;
    }
    if (successList.length) {
      return <p className={`${classPrefix}-input__extra`}>{successList[0].message}</p>;
    }

    return helpNode;
  }

  const renderSuffixIcon = () => {
    if (statusIcon === false) return null;

    const resultIcon = (iconSlot: ReactNode) => <span className={`${classPrefix}-form__status`}>{iconSlot}</span>;

    const getDefaultIcon = () => {
      const iconMap = {
        success: <CheckCircleFilledIcon size="25px" />,
        error: <CloseCircleFilledIcon size="25px" />,
        warning: <ErrorCircleFilledIcon size="25px" />,
      };
      if (verifyStatus === VALIDATE_STATUS.SUCCESS) {
        return resultIcon(iconMap[verifyStatus]);
      }
      if (errorList && errorList[0]) {
        const type = errorList[0].type || 'error';
        return resultIcon(iconMap[type]);
      }
      return null;
    };

    if (React.isValidElement(statusIcon)) {
      return resultIcon(React.cloneElement(statusIcon, { style: { color: 'unset' }, ...statusIcon.props }));
    }
    if (statusIcon === true) {
      return getDefaultIcon();
    }

    return null;
  };

  function validate(trigger) {
    if (innerFormItemsRef.current.length) {
      return innerFormItemsRef.current.map((innerFormItem) => innerFormItem?.validate());
    }
    // 过滤不需要校验的规则
    const rules = trigger === 'all' ? innerRules : innerRules.filter((item) => (item.trigger || 'change') === trigger);
    setResetValidating(true);
    // 校验结果，包含正确的校验信息
    return new Promise((resolve) => {
      validateModal(formValue, rules).then((r) => {
        const filterErrorList = r
          .filter((item) => item.result !== true)
          .map((item) => {
            Object.keys(item).forEach((key) => {
              if (!item.message && errorMessage[key]) {
                const compiled = lodashTemplate(errorMessage[key]);
                // eslint-disable-next-line no-param-reassign
                item.message = compiled({ name: label, validate: item[key] });
              }
            });
            return item;
          });
        setErrorList(filterErrorList);
        // 仅有自定义校验方法才会存在 successList
        setSuccessList(r.filter((item) => item.result === true && item.message && item.type === 'success'));
        // 根据校验结果设置校验状态
        let nextVerifyStatus = filterErrorList.length && rules.length ? VALIDATE_STATUS.FAIL : VALIDATE_STATUS.SUCCESS;
        // 非 require 且值为空 状态置为默认，无校验规则的都为默认
        if ((!rules.some((rule) => rule.required) && isValueEmpty(formValue)) || !rules.length) {
          nextVerifyStatus = VALIDATE_STATUS.TO_BE_VALIDATED;
        }
        setVerifyStatus(nextVerifyStatus);
        needResetField && resetHandler();
        setResetValidating(false);

        resolve({ [name]: !filterErrorList.length ? true : r });
      });
    });
  }

  // blur 下触发校验
  function handleItemBlur() {
    const filterRules = innerRules.filter((item) => item.trigger === 'blur');

    filterRules.length && validate('blur');
  }

  function getResetValue(resetType: string): ValueType {
    if (resetType === 'initial') {
      return getDefaultInitialData(children, initialData);
    }

    let emptyValue: ValueType = '';
    if (Array.isArray(formValue)) {
      emptyValue = [];
    } else if (isObject(formValue)) {
      emptyValue = {};
    }
    return emptyValue;
  }

  function resetField(type: string) {
    if (!name) return;

    const resetType = type || resetTypeFromContext;
    const resetValue = getResetValue(resetType);
    // 防止触发校验
    if (resetValue !== formValue) {
      shouldValidate.current = false;
    }
    setFormValue(resetValue);

    if (resetValidating) {
      setNeedResetField(true);
    } else {
      resetHandler();
    }
  }

  function resetHandler() {
    setNeedResetField(false);
    setErrorList([]);
    setSuccessList([]);
    setVerifyStatus(VALIDATE_STATUS.TO_BE_VALIDATED);
  }

  function setField(field: { value?: string; status?: VALIDATE_STATUS }) {
    const { value, status } = field;
    // 手动设置 status 则不需要校验 交给用户判断
    if (typeof status !== 'undefined') {
      shouldValidate.current = false;
      setErrorList([]);
      setSuccessList([]);
      setNeedResetField(false);
      setVerifyStatus(status);
    }
    if (typeof value !== 'undefined') {
      setFormValue(value);
    }
  }

  function setValidateMessage(validateMessage: FormItemValidateMessage[]) {
    if (!validateMessage || !Array.isArray(validateMessage)) return;
    if (validateMessage.length === 0) {
      setErrorList([]);
      setVerifyStatus(VALIDATE_STATUS.SUCCESS);
      return;
    }
    setErrorList(validateMessage);
    setVerifyStatus(VALIDATE_STATUS.FAIL);
  }

  useEffect(() => {
    // value change event
    if (isMounted.current) {
      name && onFormItemValueChange({ [name]: formValue });
    }

    // 首次渲染不触发校验 后续判断是否检验也通过此字段控制
    if (!shouldValidate.current || !isMounted.current) {
      isMounted.current = true;
      shouldValidate.current = true;
      return;
    }

    const filterRules = innerRules.filter((item) => (item.trigger || 'change') === 'change');

    filterRules.length && validate('change');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formValue]);

  useEffect(() => {
    if (!name || !formItemsRef || !formItemsRef.current) return;
    formItemsRef.current.push(currentFormItemRef);

    return () => {
      const index = formItemsRef.current.indexOf(currentFormItemRef);
      if (index !== -1) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        formItemsRef.current?.splice(index, 1);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  // 暴露 ref 实例方法
  useImperativeHandle(currentFormItemRef, (): any => ({
    name,
    value: formValue,
    setValue: setFormValue,
    setField,
    validate,
    resetField,
    setValidateMessage,
    resetValidate: resetHandler,
  }));

  return (
    <div className={formItemClass} style={style} ref={ref}>
      {label && (
        <div className={formItemLabelClass} style={labelStyle}>
          <label htmlFor={props?.for}>{label}</label>
        </div>
      )}
      <div className={contentClass()} style={contentStyle}>
        <div className={`${classPrefix}-form__controls-content`}>
          {React.Children.map(children, (child, index) => {
            if (!child) return null;

            let onChangeFromProps = () => ({});
            let onBlurFromProps = () => ({});
            let ctrlKey = 'value';
            if (React.isValidElement(child)) {
              if (child.type === FormItem) {
                return React.cloneElement(child, {
                  ref: (el) => {
                    if (!el) return;
                    innerFormItemsRef.current[index] = el;
                  },
                });
              }
              if (typeof child.props.onChange === 'function') {
                onChangeFromProps = child.props.onChange;
              }
              if (typeof child.props.onBlur === 'function') {
                onBlurFromProps = child.props.onBlur;
              }
              if (typeof child.type === 'object') {
                ctrlKey = ctrlKeyMap.get(child.type) || 'value';
              }
              return React.cloneElement(child, {
                disabled: disabledFromContext,
                ...child.props,
                [ctrlKey]: formValue,
                onChange: (value) => {
                  onChangeFromProps.call(null, value);
                  setFormValue(value);
                },
                onBlur: (value) => {
                  onBlurFromProps.call(null, value);
                  handleItemBlur();
                },
              });
            }
            return child;
          })}
          {renderSuffixIcon()}
        </div>
        {renderTipsInfo()}
      </div>
    </div>
  );
});

export default FormItem;
