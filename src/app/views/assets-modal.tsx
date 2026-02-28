import { AssetsTable } from "../../ui/assets-table"
import { clipText, formatAssetPrice } from "../helpers"
import type { AssetsModalState } from "../types"

type AssetsModalProps = {
  assetsModal: AssetsModalState
}

export function AssetsModal(props: AssetsModalProps) {
  return (
    <box flexDirection="column" width="100%" height="100%" alignItems="center" justifyContent="center">
      <box border width="92%" height="88%" padding={1} flexDirection="column">
        <box flexDirection="row" justifyContent="space-between" width="100%">
          <text>
            <strong>Available Assets</strong>
          </text>
          <text>
            <span fg="#6B7280">
              Page {props.assetsModal.page}/{props.assetsModal.totalPages}
            </span>
          </text>
        </box>
        <box marginTop={1}>
          <text>
            <span fg="#6B7280">
              {props.assetsModal.searchMode
                ? `/${props.assetsModal.searchInput}|`
                : props.assetsModal.searchApplied.length > 0
                  ? `Filter: ${props.assetsModal.searchApplied}`
                  : "Press / to search by symbol or name"}
            </span>
          </text>
        </box>
        <box marginTop={1} flexGrow={1}>
          {props.assetsModal.loading ? (
            <text>
              <span fg="#93C5FD">Loading assets...</span>
            </text>
          ) : props.assetsModal.error ? (
            <text>
              <span fg="#FCA5A5">{props.assetsModal.error}</span>
            </text>
          ) : props.assetsModal.previewOpen ? (
            <box border padding={1} width="100%" height="100%" flexDirection="column">
              <text>
                <strong>{props.assetsModal.previewAsset?.symbol ?? "Asset"}</strong>
              </text>
              <box marginTop={1}>
                {props.assetsModal.previewLoading ? (
                  <text>
                    <span fg="#93C5FD">Loading asset preview...</span>
                  </text>
                ) : props.assetsModal.previewError ? (
                  <text>
                    <span fg="#FCA5A5">{props.assetsModal.previewError}</span>
                  </text>
                ) : (
                  <text>
                    <span fg="#D1D5DB">Name: {props.assetsModal.previewAsset?.name ?? "-"}</span>
                    <br />
                    <span fg="#D1D5DB">Price: {formatAssetPrice(props.assetsModal.previewAsset?.price)}</span>
                    <br />
                    <span fg="#9CA3AF">Type: {props.assetsModal.previewAsset?.asset_type ?? "-"}</span>
                    <br />
                    <span fg="#9CA3AF">Exchange: {props.assetsModal.previewAsset?.exchange ?? "-"}</span>
                    <br />
                    <span fg="#9CA3AF">Sector: {props.assetsModal.previewAsset?.sector ?? "-"}</span>
                    <br />
                    <span fg="#9CA3AF">Country: {props.assetsModal.previewAsset?.country ?? "-"}</span>
                    <br />
                    <span fg="#9CA3AF">CEO: {props.assetsModal.previewAsset?.ceo ?? "-"}</span>
                    <br />
                    <span fg="#9CA3AF">Employees: {props.assetsModal.previewAsset?.employees ?? "-"}</span>
                    <br />
                    <span fg="#9CA3AF">Market Cap (M): {props.assetsModal.previewAsset?.market_cap_m ?? "-"}</span>
                    <br />
                    <span fg="#D1D5DB">
                      Description: {clipText(props.assetsModal.previewAsset?.description ?? "-", 360)}
                    </span>
                  </text>
                )}
              </box>
            </box>
          ) : (
            <AssetsTable assets={props.assetsModal.assets} selectedIndex={props.assetsModal.selectedIndex} />
          )}
        </box>
      </box>
    </box>
  )
}
