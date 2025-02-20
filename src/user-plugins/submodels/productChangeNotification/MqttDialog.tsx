import { Dialog, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

type MqttDialogProps = {
    readonly message: string;
    readonly onClose: () => void;
    readonly open: boolean;
};

export function MqttDialog(props: MqttDialogProps) {
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
            <DialogContent style={{ paddingLeft: '60px', paddingRight: '60px' }}>{props.message}</DialogContent>
        </Dialog>
    );
}
