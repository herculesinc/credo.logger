import { Logger } from './index';

const options = {
    name: "dev-logger",
    log: {
        messages: true,
        errors: true,
        events: true,
        metrics:true,
        services: true,
        requests: true
    },
    console: {
        prefix: false,
        color: {
            services: {
                email: "magenta"
            }
        }
    }
};


const logger = new Logger(options);

logger.debug('testing');
logger.trace('email', 'send message', 100, true);
//logger.increaseIndent();
logger.debug('testing2');
//logger.increaseIndent();
logger.debug('testing3');
//logger.decreaseIndent();
//logger.decreaseIndent();
logger.debug('testing4');