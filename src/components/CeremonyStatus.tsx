import { Card } from "./Card";


export interface CeremonyStatusProps {
  ceremonyConcluded: boolean;
  ceremonyTxId: string | null;
  ceremonyFailure: { reason: string, msg: string } | null;
  participantQueue: any[];
}

export const CeremonyStatus: React.FC<CeremonyStatusProps> = ({
  ceremonyConcluded,
  ceremonyTxId,
  ceremonyFailure,
  participantQueue
}) => (
  <>
    {ceremonyConcluded && (
      <Card title="🎉🎉🎉 Ceremony Concluded 🎉🎉🎉">
        <p>The ceremony has concluded with the transaction {ceremonyTxId}.</p>
      </Card>
    )}

    {ceremonyFailure && (
      <Card title="⚠️ Ceremony Failed" error>
        <p><strong>Reason:</strong> {ceremonyFailure.reason}</p>
        <p>{ceremonyFailure.msg}</p>
      </Card>
    )}

    {participantQueue.length > 0 && (
      <Card title="Participant Queue">
        <p>The participant queue is {participantQueue.length} participants long.</p>
      </Card>
    )}
  </>
);  