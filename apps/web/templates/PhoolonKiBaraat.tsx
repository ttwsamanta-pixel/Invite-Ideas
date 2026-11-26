import type { InvitationData } from './adapter'
import { CinematicStory } from './CinematicStory'

export default function PhoolonKiBaraat({ data }: { data: InvitationData }) {
  return <CinematicStory theme="floral" data={data} />
}
