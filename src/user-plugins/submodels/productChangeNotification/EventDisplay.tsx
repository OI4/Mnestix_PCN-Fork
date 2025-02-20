import { Typography } from '@mui/material';
import { BasicEventElement, Reference } from '@aas-core-works/aas-core3.0-typescript/types';

type EventDisplayProps = {
    event: BasicEventElement;
};

const EventDisplay = ({ event }: EventDisplayProps) => {
    console.log(event);

    const broker = event.messageBroker;

    return (
        <>
            <Typography variant="h5" component="h2" gutterBottom>
                {event.idShort}
            </Typography>
            <Typography>Direction: {event.direction}</Typography>
            <Typography>State: {event.state}</Typography>
            {broker && (broker as Reference).keys.map((key, index) => <Typography key={index}>{key.value}</Typography>)}
        </>
    );
};

export default EventDisplay;
