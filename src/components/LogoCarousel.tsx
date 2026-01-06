import { motion } from "framer-motion";

const LogoCarousel = () => {
  const cryptoLogos = [
    { name: "Bitcoin", url: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png" },
    { name: "Ethereum", url: "https://assets.coingecko.com/coins/images/279/large/ethereum.png" },
    { name: "Tether", url: "https://assets.coingecko.com/coins/images/325/large/Tether.png" },
    { name: "BNB", url: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png" },
    { name: "Solana", url: "https://assets.coingecko.com/coins/images/4128/large/solana.png" },
    { name: "XRP", url: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png" },
    { name: "USDC", url: "https://assets.coingecko.com/coins/images/6319/large/usdc.png" },
    // { name: "TradingView", url: "https://static.tradingview.com/static/images/logo-tradingview.svg" },
  ];

  const extendedLogos = [...cryptoLogos, ...cryptoLogos, ...cryptoLogos];

  return (
    <div className="w-full overflow-hidden bg-background/10 backdrop-blur-sm py-12 mt-20">
      <motion.div 
        className="flex space-x-16"
        initial={{ opacity: 0, x: "0%" }}
        animate={{
          opacity: 1,
          x: "-50%"
        }}
        transition={{
          opacity: { duration: 0.5 },
          x: {
            duration: 15,
            repeat: Infinity,
            ease: "linear",
            delay: 0.5
          }
        }}
        style={{
          width: "fit-content",
          display: "flex",
          gap: "4rem"
        }}
      >
        {extendedLogos.map((logo, index) => (
          <motion.img
            key={`logo-${index}`}
            src={logo.url}
            alt={logo.name}
            className="h-8 w-8 object-contain"
            initial={{ opacity: 0.5 }}
            whileHover={{ 
              opacity: 1,
              scale: 1.05,
              transition: { duration: 0.2 }
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default LogoCarousel;
