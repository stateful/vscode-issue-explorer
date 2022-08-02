import TelemetryReporter from '@vscode/extension-telemetry'
import type { TelemetryEventProperties, TelemetryEventMeasurements } from '@vscode/extension-telemetry'

/* eslint-disable @typescript-eslint/naming-convention */
// injected by rollup replace plugin
declare const __PACKAGE_JSON__: any
declare const __INSTRUMENTATION_KEY__: any

const PACKAGE_JSON = __PACKAGE_JSON__
const INSTRUMENTATION_KEY = __INSTRUMENTATION_KEY__
const EXTENSION_ID = `${PACKAGE_JSON.publisher}.${PACKAGE_JSON.name}`

const reporter = INSTRUMENTATION_KEY
    ? {
        sendTelemetryEvent: (
            eventName: string,
            properties?: TelemetryEventProperties,
            measurements?: TelemetryEventMeasurements
        ) => {

            const reporter = new TelemetryReporter(
                EXTENSION_ID,
                PACKAGE_JSON.version,
                INSTRUMENTATION_KEY
            )

            reporter.sendTelemetryEvent(eventName, properties, measurements)
        }
    }
    : {
        // noop
        sendTelemetryEvent: () => { }
    }

export default reporter as Pick<TelemetryReporter, 'sendTelemetryEvent'>
