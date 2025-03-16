import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

const LinearProgressWithLabel = (props) => {
    const { style = {} } = props
    return (       
        <Box sx={{...{ display: 'flex', alignItems: 'center' }, ...style}}>
            <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress variant="determinate" {...props} />
            </Box>
            <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {`${Math.round(props.value)}%`}
                </Typography>
            </Box>
        </Box>

    );
}

export default LinearProgressWithLabel