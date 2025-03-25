import { RscEntryLexicalCell as RscEntryLexicalCell_44fe37237e0ebf4470c9990d8cb7b07e } from '@payloadcms/richtext-lexical/rsc'
import { RscEntryLexicalField as RscEntryLexicalField_44fe37237e0ebf4470c9990d8cb7b07e } from '@payloadcms/richtext-lexical/rsc'
import { BlocksFeatureClient as BlocksFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { InlineToolbarFeatureClient as InlineToolbarFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { HorizontalRuleFeatureClient as HorizontalRuleFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { UploadFeatureClient as UploadFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { LinkFeatureClient as LinkFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { default as SpecialFieldHandler_e70f5e05f09f93e00b997edb1ef0c864 } from '../../../blocks/SpecialFieldHandler'
import { default as UniversalComponent_e70f5e05f09f93e00b997edb1ef0c864 } from '../../../blocks/UniversalComponent'
import { default as DebugBlockComponent_e70f5e05f09f93e00b997edb1ef0c864 } from '../../../blocks/DebugBlock/Component'
import { default as DebugBlockField_e70f5e05f09f93e00b997edb1ef0c864 } from '../../../blocks/DebugBlock/Field'
import { default as CallToActionComponent_e70f5e05f09f93e00b997edb1ef0c864 } from '../../../blocks/CallToAction/Component'
import { default as CallToActionField_e70f5e05f09f93e00b997edb1ef0c864 } from '../../../blocks/CallToAction/Field'
import { default as TestBlockComponent_e70f5e05f09f93e00b997edb1ef0c864 } from '../../../blocks/TestBlock/Component'
import { default as TestBlockField_e70f5e05f09f93e00b997edb1ef0c864 } from '../../../blocks/TestBlock/Field'
import { default as Component_e70f5e05f09f93e00b997edb1ef0c864 } from '../../../Component'

export const importMap = {
  "./Component#default": Component_e70f5e05f09f93e00b997edb1ef0c864,
  "blocks/UniversalComponent": UniversalComponent_e70f5e05f09f93e00b997edb1ef0c864,
  "blocks/UniversalComponent#default": UniversalComponent_e70f5e05f09f93e00b997edb1ef0c864,
  "blocks/DebugBlock/Component": DebugBlockComponent_e70f5e05f09f93e00b997edb1ef0c864,
  "blocks/CallToAction/Component": CallToActionComponent_e70f5e05f09f93e00b997edb1ef0c864,
  "blocks/TestBlock/Component": TestBlockComponent_e70f5e05f09f93e00b997edb1ef0c864,
  "blocks/CallToAction/Component#default": CallToActionComponent_e70f5e05f09f93e00b997edb1ef0c864,
  "blocks/CallToAction/Field": CallToActionField_e70f5e05f09f93e00b997edb1ef0c864,
  "blocks/CallToAction/Field#default": CallToActionField_e70f5e05f09f93e00b997edb1ef0c864,
  "blocks/TestBlock/Component#default": TestBlockComponent_e70f5e05f09f93e00b997edb1ef0c864,
  "blocks/TestBlock/Field": TestBlockField_e70f5e05f09f93e00b997edb1ef0c864,
  "blocks/TestBlock/Field#default": TestBlockField_e70f5e05f09f93e00b997edb1ef0c864,
  "blocks/DebugBlock/Component#default": DebugBlockComponent_e70f5e05f09f93e00b997edb1ef0c864,
  "blocks/DebugBlock/Field": DebugBlockField_e70f5e05f09f93e00b997edb1ef0c864,
  "blocks/DebugBlock/Field#default": DebugBlockField_e70f5e05f09f93e00b997edb1ef0c864,
  "custom-call-to-action#Component": CallToActionComponent_e70f5e05f09f93e00b997edb1ef0c864,
  "test-block#Component": TestBlockComponent_e70f5e05f09f93e00b997edb1ef0c864,
  "debug-block#Component": DebugBlockComponent_e70f5e05f09f93e00b997edb1ef0c864,
  "/blocks/CallToAction/Component": CallToActionComponent_e70f5e05f09f93e00b997edb1ef0c864,
  "/blocks/CallToAction/Component#default": CallToActionComponent_e70f5e05f09f93e00b997edb1ef0c864,
  "/blocks/CallToAction/Field": CallToActionField_e70f5e05f09f93e00b997edb1ef0c864,
  "/blocks/CallToAction/Field#default": CallToActionField_e70f5e05f09f93e00b997edb1ef0c864,
  "/blocks/TestBlock/Component": TestBlockComponent_e70f5e05f09f93e00b997edb1ef0c864,
  "/blocks/TestBlock/Component#default": TestBlockComponent_e70f5e05f09f93e00b997edb1ef0c864,
  "/blocks/TestBlock/Field": TestBlockField_e70f5e05f09f93e00b997edb1ef0c864,
  "/blocks/TestBlock/Field#default": TestBlockField_e70f5e05f09f93e00b997edb1ef0c864,
  "/blocks/DebugBlock/Component": DebugBlockComponent_e70f5e05f09f93e00b997edb1ef0c864,
  "/blocks/DebugBlock/Component#default": DebugBlockComponent_e70f5e05f09f93e00b997edb1ef0c864,
  "/blocks/DebugBlock/Field": DebugBlockField_e70f5e05f09f93e00b997edb1ef0c864,
  "/blocks/DebugBlock/Field#default": DebugBlockField_e70f5e05f09f93e00b997edb1ef0c864,
  "./Field#default": TestBlockField_e70f5e05f09f93e00b997edb1ef0c864,
  "./Field": TestBlockField_e70f5e05f09f93e00b997edb1ef0c864,
  "Field#default": TestBlockField_e70f5e05f09f93e00b997edb1ef0c864,
  "Field": TestBlockField_e70f5e05f09f93e00b997edb1ef0c864,
  "_components#default": SpecialFieldHandler_e70f5e05f09f93e00b997edb1ef0c864,
  "_components": SpecialFieldHandler_e70f5e05f09f93e00b997edb1ef0c864,
  "RscEntryLexicalCell": RscEntryLexicalCell_44fe37237e0ebf4470c9990d8cb7b07e,
  "RscEntryLexicalField": RscEntryLexicalField_44fe37237e0ebf4470c9990d8cb7b07e,
  "BlocksFeatureClient": BlocksFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "InlineToolbarFeatureClient": InlineToolbarFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "HorizontalRuleFeatureClient": HorizontalRuleFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "UploadFeatureClient": UploadFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "LinkFeatureClient": LinkFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/rsc#RscEntryLexicalCell": RscEntryLexicalCell_44fe37237e0ebf4470c9990d8cb7b07e,
  "@payloadcms/richtext-lexical/rsc#RscEntryLexicalField": RscEntryLexicalField_44fe37237e0ebf4470c9990d8cb7b07e,
  "@payloadcms/richtext-lexical/client#BlocksFeatureClient": BlocksFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#InlineToolbarFeatureClient": InlineToolbarFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#HorizontalRuleFeatureClient": HorizontalRuleFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#UploadFeatureClient": UploadFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#LinkFeatureClient": LinkFeatureClient_e70f5e05f09f93e00b997edb1ef0c864
}