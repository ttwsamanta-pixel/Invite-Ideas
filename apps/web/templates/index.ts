import dynamic from 'next/dynamic'
import './batch-base.css'
import './batch-two.css'

export const INVITE_IDEAS_TEMPLATE_REGISTRY = {
  RoyalIndianWedding: dynamic(() => import('./RoyalIndianWedding')),
  BengaliHeritageWedding: dynamic(() => import('./BengaliHeritageWedding')),
  SikhRoyalWedding: dynamic(() => import('./SikhRoyalWedding')),
  MuslimNikahLuxury: dynamic(() => import('./MuslimNikahLuxury')),
  ModernEditorialWedding: dynamic(() => import('./ModernEditorialWedding')),
  'phulkari-courtyard': dynamic(() => import('./PhulkariCourtyard')),
  'jasmine-zari': dynamic(() => import('./JasmineZari')),
  'alpona-silk': dynamic(() => import('./AlponaSilk')),
  'salt-sunset': dynamic(() => import('./SaltSunset')),
  'moonlit-jali': dynamic(() => import('./MoonlitJali')),
  PromiseRoka: dynamic(() => import('./PromiseRoka')),
  MidnightBirthday: dynamic(() => import('./MidnightBirthday')),
  LittleWonder: dynamic(() => import('./LittleWonder')),
  ShubhGriha: dynamic(() => import('./ShubhGriha')),
  ForeverUs: dynamic(() => import('./ForeverUs')),
  DurgaPujaDivine: dynamic(() => import('./DurgaPujaDivine')),
  NaamkaranLotus: dynamic(() => import('./NaamkaranLotus')),
  AnnaprashanHeritage: dynamic(() => import('./AnnaprashanHeritage')),
  ChristianGardenWedding: dynamic(() => import('./ChristianGardenWedding')),
  DiwaliLights: dynamic(() => import('./DiwaliLights')),
  LifafaEIshq: dynamic(() => import('./LifafaEIshq')),
  RoyalPalaceGates: dynamic(() => import('./RoyalPalaceGates')),
  PhoolonKiBaraat: dynamic(() => import('./PhoolonKiBaraat')),
  SheeshMahal: dynamic(() => import('./SheeshMahal')),
  RajwadiParchment: dynamic(() => import('./RajwadiParchment')),
} as const

export function resolveTemplate(key: string) {
  return Object.hasOwn(INVITE_IDEAS_TEMPLATE_REGISTRY, key)
    ? INVITE_IDEAS_TEMPLATE_REGISTRY[key as keyof typeof INVITE_IDEAS_TEMPLATE_REGISTRY]
    : undefined
}
