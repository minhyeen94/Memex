import React from 'react'
import ReactDOM from 'react-dom'
import { StyleSheetManager, ThemeProvider } from 'styled-components'

import TooltipContainer, {
    Props,
} from '@worldbrain/memex-common/lib/in-page-ui/tooltip/container'
import { theme } from 'src/common-ui/components/design-library/theme'
import type { InPageUIRootMount } from 'src/in-page-ui/types'

export function setupUIContainer(
    mount: InPageUIRootMount,
    params: Omit<Props, 'onTooltipInit'>,
): Promise<() => void> {
    return new Promise(async (resolve) => {
        ReactDOM.render(
            <StyleSheetManager target={mount.shadowRoot as any}>
                <ThemeProvider theme={theme}>
                    <TooltipContainer
                        onTooltipInit={(showTooltip) => resolve(showTooltip)}
                        {...params}
                        context="extension"
                    />
                </ThemeProvider>
            </StyleSheetManager>,
            mount.rootElement,
        )
    })
}

export function destroyUIContainer(target) {
    ReactDOM.unmountComponentAtNode(target)
}
