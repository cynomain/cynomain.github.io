class LRC {
    static Parse(text) {
        const REG_FETCH_LINE = /([^\]]+$)/;
        const REG_FETCH_TIME = /\[(.*?)\]/g;
        let lyrics = [];
        let lines = text.split('\n');


        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
                if (line.startsWith('[')) {
                    //Is a line
                    let lyric = line.match(REG_FETCH_LINE);
                    if (!lyric) {
                        //ERROR
                        console.error(`[LRC] Error parsing "${line}" (Error fetching line)`);
                        //lyric = ["", ""]; //WORK AROUND
                        continue;
                    }

                    let times = line.matchAll(REG_FETCH_TIME);
                    if (!times) {
                        console.error(`[LRC] Error parsing "${line}" (Error fetching time)`);
                        continue;
                    }

                    times.forEach(t => {
                        let stripped = t[1].trim('[').trim(']');
                        let split = stripped.split(':').join(',').split('.').join(',').split(',');
                        let mins = 0;
                        let secs = 0;
                        let cents = 0;

                        if (split.length < 2) {
                            console.error(`[LRC] Error parsing "${line}" (Error parsing time)`);
                            return;
                        }

                        if (split.length > 2) {
                            mins = parseInt(split[0]);
                            secs = parseInt(split[1]);
                            cents = parseInt(split[2]);
                        } else if (split.length > 1) {
                            secs = parseInt(split[0]);
                            cents = parseInt(split[1]);
                        }

                        let totalSeconds = mins * 60.0 + secs + cents / 100.0;
                        lyrics.push({ Text: lyric[1].trim(), Time: totalSeconds });
                    });
                }
            }
        }

        lyrics.sort((a, b) => {
            if (a.Time > b.Time) {
                return 1;
            }
            if (a.Time < b.Time) {
                return -1;
            }
            return 0;
        })

        let finalLyrics = [];
        for (let j = 0; j < lyrics.length; j++) {
            const element = lyrics[j];
            let nextElement = lyrics.length > j+1 ? lyrics[j+1] : null;
            finalLyrics.push(
                {
                    Type: "Vocal",
                    OppositeAligned: false,
                    Text: element.Text,
                    StartTime: element.Time,
                    EndTime: nextElement ? nextElement.Time : element.Time + 5
                }
            )
        }

        let finalObject = {
            StartTime: finalLyrics[0].StartTime,
            EndTime: finalLyrics[finalLyrics.length - 1].EndTime,
            Type: "Line",
            Content: finalLyrics
        };
        return finalObject;
    }
}