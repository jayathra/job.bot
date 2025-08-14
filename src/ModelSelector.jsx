import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

export default function ModelSelector({ handleSelector, model }) {
    return (
        <FormControl sx={{ m: 1, minWidth: 60 }}>
            <InputLabel id="model">Model</InputLabel>
            <Select
                labelId="model"
                id="model"
                value={model}
                label="Select Model"
                onChange={handleSelector}
            >
                <MenuItem value="">
                    <em>None</em>
                </MenuItem>
                <MenuItem value="gpt">GPT</MenuItem>
                <MenuItem value="qwen">Qwen</MenuItem>
            </Select>
            <FormHelperText>Pick between frontier and open source</FormHelperText>
        </FormControl>
    )
}