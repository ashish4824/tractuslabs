export default function DateFormat(date) {
    const d = new Date(date);
    const day = d.getDate();
    const year = d.getFullYear();
    const month = d.toLocaleString('default', { month: 'long' });
    return `${day} / ${month} / ${year}`;
  }
  