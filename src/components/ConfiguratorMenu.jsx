import {
  configuratorButtonStyle,
  panelSectionStyle
} from "../styles/appStyles.js";

const CONFIGURATORS = [
  {
    name: "gripper",
    textKey: "gripper"
  },
  {
    name: "pallet",
    textKey: "pallet"
  },
  {
    name: "pieces",
    textKey: "pieces"
  },
  {
    name: "separators",
    textKey: "separators"
  },
  {
    name: "conveyor",
    textKey: "conveyor"
  },
  {
    name: "layers",
    textKey: "layers"
  },
  {
    name: "palletizing",
    textKey: "palletizing"
  }
];

export default function ConfiguratorMenu({
  activeConfigurator,
  onSelectConfigurator,
  t
}) {
  return (
    <section
      style={{
        ...panelSectionStyle,
        marginBottom: "12px"
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "7px"
        }}
      >
        {CONFIGURATORS.map(
          (configurator) => {
            const isActive =
              activeConfigurator ===
              configurator.name;

            return (
              <button
                key={configurator.name}
                type="button"
                onClick={() => {
                  onSelectConfigurator(
                    configurator.name
                  );
                }}
                style={{
                  ...configuratorButtonStyle,
                  borderColor: isActive
                    ? "#2767c5"
                    : "#aeb6bf",
                  background: isActive
                    ? "#eef4fb"
                    : "#ffffff",
                  color: isActive
                    ? "#2767c5"
                    : "#303840"
                }}
              >
                {
                  t.configurators[
                    configurator.textKey
                  ]
                }
              </button>
            );
          }
        )}
      </div>
    </section>
  );
}
