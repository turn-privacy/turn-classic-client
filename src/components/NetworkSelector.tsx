import { Card } from "./Card";
import { Button } from "./Button";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setSelectedNetwork } from "../store/networkSlice";

export const NetworkSelector: React.FC = () => {
    const dispatch = useAppDispatch();
    const selectedNetwork = useAppSelector(state => state.network.selectedNetwork);

    return (
        <Card title="Select Network">
            <div style={{ display: "flex", flexDirection: "row", gap: "1rem" }}>
                <Button
                    onClick={() => dispatch(setSelectedNetwork('local'))}
                    style={{
                        backgroundColor: selectedNetwork === 'local' ? "#00aaff" : "transparent"
                    }}
                >
                    Local
                </Button>
                <Button
                    onClick={() => dispatch(setSelectedNetwork('preview'))}
                    style={{
                        backgroundColor: selectedNetwork === 'preview' ? "#00aaff" : "transparent"
                    }}
                >
                    Preview
                </Button>
            </div>
        </Card>
    );
};