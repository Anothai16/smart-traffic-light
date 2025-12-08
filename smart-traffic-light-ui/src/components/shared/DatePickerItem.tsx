/* eslint-disable react-refresh/only-export-components */
import { Format } from '@/constants/format';
import { disabledEndDate, disabledStartDate } from '@/utils/date';
import type { DatePickerProps, FormItemProps } from 'antd';
import { DatePicker, Form } from 'antd';
const From = ({
  endDateName = 'endDate',
  datePickerProps,
  ...props
}: FormItemProps & { endDateName?: string; datePickerProps?: DatePickerProps }) => {
  return (
    <Form.Item dependencies={[endDateName]} noStyle>
      {({ getFieldValue }) => {
        const endDate = getFieldValue(endDateName);
        return (
          <Form.Item name="startDate" {...props}>
            <DatePicker
              format={Format.COMMON_DATE}
              className="w-full"
              placeholder="Start Date"
              disabledDate={disabledStartDate(endDate)}
              allowClear
              {...datePickerProps}
            />
          </Form.Item>
        );
      }}
    </Form.Item>
  );
};
const To = ({
  startDateName = 'startDate',
  datePickerProps,
  ...props
}: FormItemProps & { startDateName?: string; datePickerProps?: DatePickerProps }) => {
  return (
    <Form.Item dependencies={[startDateName]} noStyle>
      {({ getFieldValue }) => {
        const startDate = getFieldValue(startDateName);
        return (
          <Form.Item name="endDate" {...props}>
            <DatePicker
              format={Format.COMMON_DATE}
              className="w-full"
              placeholder="End Date"
              disabledDate={disabledEndDate(startDate)}
              allowClear
              {...datePickerProps}
            />
          </Form.Item>
        );
      }}
    </Form.Item>
  );
};

export default { From, To };
