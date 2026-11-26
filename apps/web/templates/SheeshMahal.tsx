import type { InvitationData } from './adapter'
import { CinematicStory } from './CinematicStory'

export default function SheeshMahal({ data }: { data: InvitationData }) {
  return <CinematicStory theme="mirror" data={data} />
}
