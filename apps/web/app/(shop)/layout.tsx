import { Footer, Header } from '../../components/shell'
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <><Header /><main>{children}</main><Footer /></>
}
