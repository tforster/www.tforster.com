{{{
  "title": "Power In G",
  "tags": ["blog", "TBWA\\Toronto"],
  "category": "projects",
  "date": "2013/08/17"
}}}

Infiniti Performance in G was a TV spot produced in December of 2012 and aired in early 2013. It depicted the new model G sitting on a dynamometer that was mysteriously connected to 20 Bose speakers. As the vehicle accelerated it appeared to direct a musical composition in real-time that played through each successive speaker. The entire affect could have been achieved in post-production but our ECD wanted to be true to the concept and actually have the car direct the music.


However, the dyno we had available did not have any real-time output, proprietary or otherwise. Short of tearing apart a quarter million dollar piece of hardware belonging to a real garage that had a full schedule of vehicles lined up the next day we had no way of obtaining the data we needed. After some hurried research based on the notion that "modern cars have computers and computers can be made to talk to each other" I focussed on the on-board diagnostics port and the auto industry standard OBDII protocol.

The final solution involved writing custom C# code running on a laptop connected via USB-OBDII to the vehicles OBDII port (found in the drivers footwell in most modern vehicles). Real-time telemetry from many sensors including RPM and gear was parsed from it's proprietary format to JSON before being transmitted over a local WiFi connection to another laptop running MaxMSP and the MSP patch created by a professional composer. The MSP patch interpreted the JSON data and used it to control the MIDI outputs. 

