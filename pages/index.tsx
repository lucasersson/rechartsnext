import * as React from 'react';
import { FetchTVMazeData } from '../lib/FetchTVMazeData';
import {
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CustomChartProps,
  Episode,
  SeriesData,
  TVMazeRes,
} from '../models/types';
import Image from 'next/image';

function App() {
  const [error, setError] = React.useState<string | null>(null);
  const [showRadar, setShowRadar] = React.useState(false);
  const [data, setData] = React.useState<TVMazeRes>();
  const inputRef = React.useRef<any>('');

  const handleSubmit = React.useCallback(
    async (e: React.SyntheticEvent) => {
      e.preventDefault();

      const res = await FetchTVMazeData(
        `https://api.tvmaze.com/singlesearch/shows?q=${inputRef.current.value}&embed=episodes`
      );

      switch (res.status) {
        case 200:
          inputRef.current.value = '';
          setData(res.parsedBody);
          setError(null);
          break;
        case 404:
          setError('Could not find series');
          break;
        default:
          setError('Error making request');
          break;
      }
    },
    [inputRef]
  );

  function getSeasonData(episodesData: Episode[] | undefined) {
    const distinctSeasons = [...new Set(episodesData?.map(e => e.season))]
      .length;

    const seasonsArray = Object.entries(
      episodesData?.reduce((r, a) => {
        r[a.season] = r[a.season] || [];
        r[a.season].push(a);
        return r;
      }, Object.create(null)) || []
    )
      .map(s => {
        return s[1];
      })
      .map((season: any) => {
        return (
          Math.round(
            (season.reduce((a: number, b: Episode) => a + b.rating.average, 0) /
              season.length) *
              100
          ) / 100
        );
      });

    return { distinctSeasons, seasonsArray };
  }

  const CustomLineChart = (props: CustomChartProps) => {
    return (
      <LineChart width={props.width} height={props.height} data={props.data}>
        <CartesianGrid strokeDasharray='3 3' />
        <XAxis dataKey='season' />
        <YAxis type='number' domain={[0, 10]} />
        <Tooltip
          labelFormatter={value => {
            return `Season ${value}`;
          }}
        />
        <Line
          name='Average Rating'
          type='monotone'
          dataKey='rating'
          stroke={props.color}
          activeDot={{ r: 8 }}
        />
      </LineChart>
    );
  };

  const CustomRadarChart = (props: CustomChartProps) => {
    return (
      <RadarChart width={props.width} height={props.height} data={props.data}>
        <PolarGrid />
        <PolarAngleAxis dataKey='season' />
        <PolarRadiusAxis domain={[0, 10]} />
        <Tooltip
          labelFormatter={value => {
            return `Season ${value}`;
          }}
        />
        <Radar
          name='Average Rating'
          dataKey='rating'
          stroke={props.color}
          fill={props.color}
          fillOpacity={0.6}
        />
      </RadarChart>
    );
  };

  function RenderChart({ series_data }: SeriesData) {
    if (!series_data) return <></>;

    const { distinctSeasons, seasonsArray } = getSeasonData(
      series_data._embedded.episodes
    );

    const data = seasonsArray.map((s, i) => ({ season: i + 1, rating: s }));

    if (!error && distinctSeasons <= 2) {
      return <p>This show has too few seasons to render a chart</p>;
    }

    if (error) {
      return <p>{error}</p>;
    }

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <p>{series_data.name}</p>
        <button onClick={() => setShowRadar(!showRadar)}>
          {showRadar ? 'Line Chart' : 'Radar Chart'}
        </button>
        {showRadar ? (
          <CustomRadarChart
            width={500}
            height={500}
            data={data}
            color='#8884d8'
          />
        ) : (
          <CustomLineChart
            width={1100}
            height={300}
            data={data}
            color='#8884d8'
          />
        )}
      </div>
    );
  }

  return (
    <>
      <div style={{ opacity: 0.5, cursor: 'pointer' }}>
        <a href='https://github.com/lucasersson/rechartsnext'>
          <Image
            src='https://cdn-icons-png.flaticon.com/512/25/25231.png'
            alt='github'
            width={30}
            height={30}
          />
        </a>
      </div>
      <div
        className='App'
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: '50px',
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <h1>TV Shows Rating Guide</h1>

          <input ref={inputRef} type='text' style={{ width: '350px' }}></input>
          <button type='submit' style={{ width: '100px', marginTop: '10px' }}>
            Submit
          </button>
        </form>
        <div style={{ marginTop: '50px' }}>
          <RenderChart series_data={data} />
        </div>
      </div>
    </>
  );
}

export default App;
