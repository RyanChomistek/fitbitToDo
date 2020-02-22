import { inbox, outbox } from "file-transfer";
import { encode } from 'cbor';

export function SendMessage(messageTitle, messageBody)
{
	outbox.enqueue(messageTitle, encode(messageBody)).then((ft) => {
		console.log(`Transfer of ${ft.name} successfully queued.`);
	  })
	  .catch((error) => {
		console.log(`Failed to queue ${messageTitle}: ${error}`);
	  })
}