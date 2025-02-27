import { Dialog, DialogContent, IconButton, Typography, styled, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import moment from 'moment';

type MqttDialogProps = {
    readonly message: string;
    readonly onClose: () => void;
    readonly open: boolean;
};

const Item = styled(Box)(({ theme }) => ({
    padding: theme.spacing(1),
    textAlign: 'left',
    color: theme.palette.text.secondary,
}));

const Title = styled(Typography)(({ theme }) => ({
    color: theme.palette.primary.main,
    fontWeight: 'bold',
}));

export function MqttDialog(props: MqttDialogProps) {
    if (!props.message || props.message === '') return;

    let reasonOfChange;
    let jsonParsed;

    try {
        jsonParsed = JSON.parse(props.message);
        reasonOfChange = JSON.parse(jsonParsed.ReasonOfChange)[0];
    } catch (err) {
        console.warn('Error while parsing the message:', err);
        return;
    }

    if (!reasonOfChange) return;

    const formattedDate = moment(jsonParsed.DateOfRecord).format('MMMM Do YYYY, h:mm:ss a');

    return (
        <Dialog
            open={props.open}
            onClose={props.onClose}
            maxWidth="sm"
            fullWidth={true}
            data-testid="compare-aas-aad-dialog"
        >
            <IconButton
                aria-label="close"
                onClick={props.onClose}
                sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: (theme) => theme.palette.grey[500],
                }}
            >
                <CloseIcon />
            </IconButton>
            <DialogContent style={{ paddingLeft: '60px', paddingRight: '60px' }}>
                <Box sx={{ marginTop: 2 }}>
                    <Item>
                        <Title variant="subtitle1">Version of Classification System:</Title>
                        <Typography variant="body2">
                            {reasonOfChange?.VersionOfClassificationSystem || 'N/A'}
                        </Typography>
                    </Item>
                    <Item>
                        <Title variant="subtitle1">Reason ID:</Title>
                        <Typography variant="body2">{reasonOfChange?.ReasonId || 'N/A'}</Typography>
                    </Item>
                    <Item>
                        <Title variant="subtitle1">Reason Classification System:</Title>
                        <Typography variant="body2">{reasonOfChange?.ReasonClassificationSystem || 'N/A'}</Typography>
                    </Item>
                    <Item>
                        <Title variant="subtitle1">Date of Record:</Title>
                        <Typography variant="body2">{formattedDate}</Typography>
                    </Item>
                </Box>
            </DialogContent>
        </Dialog>
    );
}
