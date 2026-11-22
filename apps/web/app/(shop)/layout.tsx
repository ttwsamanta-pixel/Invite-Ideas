import { Footer, Header } from '../../components/shell'
import { getSiteCopy } from '../../lib/content'

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const copy = await getSiteCopy()
  return <><Header /><main>{children}</main><Footer description={copy.footerDescription} /></>
}
