import { Card } from "./Card";
import { useAppSelector } from "../store/hooks";

export const CeremonyStatus: React.FC = () => {
    const {
        ceremonyConcluded,
        ceremonyTxId,
        ceremonyFailure,
        participantQueue
    } = useAppSelector(state => state.ceremony);

    return (
        <>
            {ceremonyFailure && (
                <Card title="Ceremony Failed" error>
                    <p>Reason: {ceremonyFailure.reason}</p>
                    <p>Message: {ceremonyFailure.msg}</p>
                </Card>
            )}

            {ceremonyConcluded && ceremonyTxId && (
                <Card title="Ceremony Concluded">
                    <p>Transaction ID: {ceremonyTxId}</p>
                </Card>
            )}

            {participantQueue.length > 0 && (
                <Card title="Participant Queue">
                    <ul>
                        {participantQueue.map((participant, index) => (
                            <li key={index}>{participant}</li>
                        ))}
                    </ul>
                </Card>
            )}
        </>
    );
};  