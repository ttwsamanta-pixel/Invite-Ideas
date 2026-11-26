import dynamic from 'next/dynamic'
import './batch-base.css'

export const INVITE_IDEAS_TEMPLATE_REGISTRY = {
  RoyalIndianWedding: dynamic(() => import('./RoyalIndianWedding')),
  BengaliHeritageWedding: dynamic(() => import('./BengaliHeritageWedding')),
  SikhRoyalWedding: dynamic(() => import('./SikhRoyalWedding')),
  MuslimNikahLuxury: dynamic(() => import('./MuslimNikahLuxury')),
  ModernEditorialWedding: dynamic(() => import('./ModernEditorialWedding')),
} as const

export function resolveTemplate(key: string) {
  return Object.hasOwn(INVITE_IDEAS_TEMPLATE_REGISTRY, key)
    ? INVITE_IDEAS_TEMPLATE_REGISTRY[key as keyof typeof INVITE_IDEAS_TEMPLATE_REGISTRY]
    : undefined
}
