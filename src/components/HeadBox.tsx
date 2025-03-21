import { Menu } from './Menu';

export const HeadBox = () => {
    return (
        <div className="head-box">
            <div className="head-box-title">
                <img
                    src="/logo-footer.png"
                    alt="logo"
                />
                <h1>
                    Turn
                </h1>
                {
                    process.env.REACT_APP_NETWORK === "preview" && (
                        <div className="head-box-network">
                            <a href="https://docs.cardano.org/cardano-testnets/tools/faucet" target="_blank" rel="noopener noreferrer">
                                preview
                            </a>
                        </div>
                    )
                }
            </div>
            <div className="head-box-items">
                <Menu />
            </div>
        </div>
    );
};