import type { InvitationData } from './adapter'
import { CinematicStory } from './CinematicStory'

export default function LifafaEIshq({ data }: { data: InvitationData }) {
  return <CinematicStory theme="burgundy" data={data} />
}
