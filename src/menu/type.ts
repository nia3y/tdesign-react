/* eslint-disable */

/**
 * 该文件为脚本自动生成文件，请勿随意修改。如需修改请联系 PMC
 * updated at 2021-12-27 17:08:43
 * */

import { TNode, TElement } from '../common';
import { MouseEvent } from 'react';

export interface TdMenuProps {
  /**
   * 是否收起菜单
   * @default false
   */
  collapsed?: boolean;
  /**
   * 展开的子菜单集合
   */
  expanded?: Array<MenuValue>;
  /**
   * 展开的子菜单集合，非受控属性
   */
  defaultExpanded?: Array<MenuValue>;
  /**
   * 同级别互斥展开
   * @default false
   */
  expandMutex?: boolean;
  /**
   * 二级菜单展开方式，平铺展开和浮层展开
   * @default normal
   */
  expandType?: 'normal' | 'popup';
  /**
   * 站点 LOGO
   */
  logo?: TElement;
  /**
   * 导航操作区域
   */
  operations?: TElement;
  /**
   * 菜单风格
   * @default light
   */
  theme?: 'light' | 'dark';
  /**
   * 激活菜单项
   */
  value?: MenuValue;
  /**
   * 激活菜单项，非受控属性
   */
  defaultValue?: MenuValue;
  /**
   * 菜单宽度。值类型为数组时，分别表示菜单展开和折叠的宽度。[ 展开时的宽度, 折叠时的宽度 ]，示例：['200px', '80px']
   * @default '232px'
   */
  width?: string | number | Array<string | number>;
  /**
   * 激活菜单项发生变化时触发
   */
  onChange?: (value: MenuValue) => void;
  /**
   * 侧边栏导航展开/收起发生变化时触发
   */
  onCollapsed?: (options: { collapsed: boolean; e?: MouseEvent<HTMLDivElement> }) => void;
  /**
   * 展开的菜单项发生变化时触发
   */
  onExpand?: (value: Array<MenuValue>) => void;
}

export interface TdHeadMenuProps {
  /**
   * 展开的子菜单集合
   */
  expanded?: Array<MenuValue>;
  /**
   * 展开的子菜单集合，非受控属性
   */
  defaultExpanded?: Array<MenuValue>;
  /**
   * 二级菜单展开方式，平铺展开和浮层展开
   * @default normal
   */
  expandType?: 'normal' | 'popup';
  /**
   * 站点 LOGO
   */
  logo?: TElement;
  /**
   * 导航操作区域
   */
  operations?: TElement;
  /**
   * null
   * @default light
   */
  theme?: 'light' | 'dark';
  /**
   * 激活菜单项
   */
  value?: MenuValue;
  /**
   * 激活菜单项，非受控属性
   */
  defaultValue?: MenuValue;
  /**
   * 激活菜单项发生变化时触发
   */
  onChange?: (value: MenuValue) => void;
  /**
   * 展开的菜单项发生变化时触发
   */
  onExpand?: (value: Array<MenuValue>) => void;
}

export interface TdSubmenuProps {
  /**
   * 菜单项内容，同 content
   */
  children?: TNode;
  /**
   * 菜单项内容
   */
  content?: TNode;
  /**
   * 是否禁用菜单项展开/收起/跳转等功能
   */
  disabled?: boolean;
  /**
   * 菜单项图标
   */
  icon?: TElement;
  /**
   * 二级菜单内容
   */
  title?: TNode;
  /**
   * 菜单项唯一标识
   */
  value?: MenuValue;
}

export interface TdMenuItemProps {
  /**
   * 菜单项内容，同 content
   */
  children?: TNode;
  /**
   * 菜单项内容
   */
  content?: TNode;
  /**
   * 是否禁用菜单项展开/收起/跳转等功能
   */
  disabled?: boolean;
  /**
   * 跳转链接
   * @default ''
   */
  href?: string;
  /**
   * 图标
   */
  icon?: TElement;
  /**
   * 链接或路由跳转方式
   */
  target?: '_blank' | '_self' | '_parent' | '_top';
  /**
   * 菜单项唯一标识
   */
  value?: MenuValue;
  /**
   * 点击时触发
   */
  onClick?: (context: { e: MouseEvent<HTMLElement> }) => void;
}

export interface TdMenuGroupProps {
  /**
   * 菜单组标题
   */
  title?: TNode;
}

export type MenuValue = string | number;
